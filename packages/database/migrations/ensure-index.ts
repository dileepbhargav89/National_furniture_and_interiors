// Idempotent index creation — docs/13_deployment_strategy.md §5.1 ("every migration is
// idempotent") and this package's own `Migration` contract ("Must be safe to run repeatedly").
//
// ---- WHY THIS EXISTS ------------------------------------------------------------------------
// `createIndex` is only idempotent while the requested spec matches the stored one exactly. Once
// a LATER migration corrects an index — which docs/13 §5.1 requires, since corrections go forward
// rather than by editing an applied migration — the earlier migration's unchanged `createIndex`
// call starts failing with `IndexKeySpecsConflict` (code 86): same name, different spec.
//
// That turned the whole suite non-re-runnable when `0005` corrected `0001`'s `uniq_phone_active`.
// It matters more here than it would elsewhere: ADR-0001 (`schema_migrations` tracking) is not
// approved, so `run.ts` records nothing and re-applies EVERY migration on EVERY run. Idempotency
// is not a nicety in that design — it is the entire safety argument. With `0001` throwing, a
// second run aborted before `0002`–`0005` executed at all.
//
// ---- THE RULE -------------------------------------------------------------------------------
// An index NAME is owned by whichever migration most recently defines it. If an index with the
// requested name already exists, the earlier migration must not try to recreate it: the current
// shape is either the one it created, or a later migration's deliberate correction. Either way,
// re-asserting a stale spec is wrong.
//
// This is deliberately name-based, not spec-comparing. A spec comparison would have to decide
// whether a difference is "a later migration's correction" (leave it) or "drift" (fix it), and it
// cannot tell those apart. Each migration's own `verify()` asserts the shape it cares about —
// `0005.verify()` checks the corrected partial filter — so drift is caught there, by the
// migration that actually owns the final shape.
import type { Db } from './types';

type IndexKeys = Record<string, 1 | -1>;

interface IndexOptions {
  name: string;
  unique?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
}

/**
 * Creates `options.name` on `collectionName` only if no index of that name exists.
 *
 * @returns `'created'` when it was created, `'exists'` when it was already present.
 */
export async function ensureIndex(
  db: Db,
  collectionName: string,
  keys: IndexKeys,
  options: IndexOptions,
): Promise<'created' | 'exists'> {
  const collection = db.collection(collectionName);

  // A collection that does not exist yet has no indexes; listing it must not throw. The driver
  // returns an empty result rather than erroring for a missing namespace on modern servers, but
  // this stays defensive because migration 0001 runs against an empty database by definition.
  let existingNames: Set<string>;
  try {
    const existing = await collection.indexes();
    // The driver types `name` as optional, so unnamed entries are filtered rather than cast.
    existingNames = new Set(
      existing
        .map((index) => index.name)
        .filter((name): name is string => typeof name === 'string'),
    );
  } catch {
    existingNames = new Set();
  }

  if (existingNames.has(options.name)) {
    return 'exists';
  }

  await collection.createIndex(keys, options);
  return 'created';
}
