// Migration 0005 — corrects the partial-unique index on `users.phone`.
//
// Category: `index` (docs/13_deployment_strategy.md §5.1's first change type).
//
// ---- THE DEFECT -----------------------------------------------------------------------------
// Migration 0001 created:
//     { phone: 1 } unique, partialFilterExpression: { isDeleted: false }
// following docs/03 §10.2's rule ("indexed as a partial unique index filtered on isDeleted: false").
//
// But `users.phone` is OPTIONAL (docs/03 §9.1.1 does not mark it required — a customer may register
// with email only). MongoDB indexes a missing/null field as `null`, and `null` counts as a value
// for uniqueness. So the SECOND account without a phone number failed with:
//     E11000 duplicate key error … index: uniq_phone_active dup key: { phone: null }
//
// Found by running the Sprint 1 acceptance flow against the live stack: the bootstrap SUPER_ADMIN
// (phone: null) consumed the single permitted null, so the first real customer registration got a
// 500. In effect the index limited the entire platform to one phone-less account.
//
// ---- THE FIX --------------------------------------------------------------------------------
// Narrow the partial filter so only documents that actually HAVE a string phone are indexed:
//     partialFilterExpression: { isDeleted: false, phone: { $type: 'string' } }
//
// This does not weaken docs/03 §10.2's intent — real phone values remain unique among non-deleted
// users, and a soft-deleted document's value is still reusable. It only stops the index claiming
// that "absent" is a value that must be unique.
//
// `users.email` is unaffected: it is required (docs/03 §9.1.1), so it is never null.
//
// Migration 0001 is deliberately NOT edited: docs/13 §5.1 treats migrations as versioned scripts,
// and 0001 has already been applied. Corrections go forward, never by mutating history.
import type { Db } from './types';
import type { Migration } from './types';

const INDEX_NAME = 'uniq_phone_active';

export const migration: Migration = {
  id: '0005',
  description: 'Fix users.phone partial-unique index so null/absent phones are not indexed',
  category: 'index',

  async apply(db: Db): Promise<void> {
    const users = db.collection('users');
    const existing = await users.indexes();
    const current = existing.find((index) => index.name === INDEX_NAME);

    const alreadyCorrect =
      current &&
      typeof current.partialFilterExpression === 'object' &&
      current.partialFilterExpression !== null &&
      'phone' in (current.partialFilterExpression as Record<string, unknown>);

    if (alreadyCorrect) {
      return; // Idempotent (docs/13 §5.1) — nothing to do on a re-run.
    }

    if (current) {
      await users.dropIndex(INDEX_NAME);
    }

    await users.createIndex(
      { phone: 1 },
      {
        unique: true,
        partialFilterExpression: { isDeleted: false, phone: { $type: 'string' } },
        name: INDEX_NAME,
      },
    );
  },

  // docs/13 §5.5 — post-migration validation.
  async verify(db: Db): Promise<void> {
    const indexes = await db.collection('users').indexes();
    const index = indexes.find((i) => i.name === INDEX_NAME);

    if (!index) {
      throw new Error(`Migration 0005 verification failed: ${INDEX_NAME} is missing`);
    }
    const filter = index.partialFilterExpression as Record<string, unknown> | undefined;
    if (!filter || !('phone' in filter)) {
      throw new Error(
        'Migration 0005 verification failed: partial filter does not constrain phone by type',
      );
    }
    if (index.unique !== true) {
      throw new Error('Migration 0005 verification failed: index is no longer unique');
    }
  },
};
