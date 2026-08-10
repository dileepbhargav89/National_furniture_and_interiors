// Migration runner — docs/06_project_structure.md §5, docs/13_deployment_strategy.md §5.1.
//
// Invoked by `pnpm --filter=@nfi/database-tools migrate`. Offline tooling: never imported by the
// running application (docs/06 §4.4's runtime-connection vs. offline-schema-evolution split).
//
// ── schema_migrations tracking is NOT implemented here, deliberately ──────────────────────────
// docs/13 §5.6 specifies a `schema_migrations` tracking collection, but it is not in
// docs/03_database_design.md §4's Collection Inventory, and docs/18_CLAUDE_CONSTITUTION.md §2.6
// requires that gap be "formally closed via ADR before or during its first use, not silently
// implemented". That ADR is drafted at docs/adr/0001-schema-migrations-collection.md and is
// PROPOSED, not approved — so per docs/18 §6.4 ("the ADR must be Approved before dependent
// implementation code is written") this runner creates no tracking collection and records nothing.
//
// It is safe without tracking only because docs/13 §5.1 requires every migration to be idempotent
// regardless, so a full re-run is a no-op. The single extension point is marked below.
import mongoose from 'mongoose';
import type { Db } from './types';
import type { Migration } from './types';
import { migration as m0001 } from './0001-identity-indexes';
import { migration as m0002 } from './0002-identity-reference-data';

/** Ordered by `id`. Adding a migration means adding it here — explicit, not filesystem-magic. */
const MIGRATIONS: Migration[] = [m0001, m0002];

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required to run migrations');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db as unknown as Db;

  try {
    for (const migration of MIGRATIONS.sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`[${migration.id}] applying (${migration.category}): ${migration.description}`);
      await migration.apply(db);

      // docs/13 §5.5 — "a migration is not considered complete until this check passes, and a
      // failed check triggers Section 6.2's database rollback procedure rather than being
      // investigated after the fact with production already in an unverified state."
      await migration.verify(db);
      console.log(`[${migration.id}] verified`);

      // EXTENSION POINT — once docs/adr/0001 is Approved, record the applied migration in the
      // `schema_migrations` collection here (migrationId, description, category, appliedAt,
      // appliedBy, verifiedAt), per docs/13 §5.6 and §10.2's release-checklist item.
    }
    console.log(`All ${MIGRATIONS.length} migration(s) applied and verified.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Migration run failed:', error);
  process.exitCode = 1;
});
