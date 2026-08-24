// Migration 0001 — indexes for the Identity & Access collections (docs/03_database_design.md §9.1,
// §9.8.2). Category: `index` (docs/13_deployment_strategy.md §5.1's first change type).
//
// Scope note: this creates INDEXES ONLY. It deliberately does not create collections, Mongoose
// schemas, or $jsonSchema validators — MongoDB creates a collection implicitly on first index/write,
// and the $jsonSchema validators (docs/03 §12) belong to a separate `validator`-category migration
// authored alongside the module that owns the writes. No business logic, no seed rows.
//
// Index sources (every one cited, none invented):
//   docs/03 §10.6  — the day-one Critical Indexes list
//   docs/03 §10.2  — "every 'must be unique' field... indexed as a partial unique index filtered
//                     on isDeleted: false", generalized by §3.1's soft-delete rule
//   docs/03 §10.3  — TTL indexes on the three ephemeral auth collections
//
// Idempotency note (added at Sprint 1 closure): index creation goes through `ensureIndex`, which
// skips an index whose NAME already exists. Migration 0005 later corrects `uniq_phone_active`, and
// a plain `createIndex` here would then re-assert the stale spec and fail with
// `IndexKeySpecsConflict` on every subsequent run — aborting the suite before 0002–0005 execute.
// See `ensure-index.ts` for the full reasoning. On a fresh database the resulting schema is
// unchanged; only the "already exists" path differs.
import { ensureIndex } from './ensure-index';
import type { Db } from './types';
import type { Migration } from './types';

/** docs/03 §3.1 — a soft-deleted document's unique value must be reusable by a new document. */
const NOT_DELETED = { isDeleted: false };

export const migration: Migration = {
  id: '0001',
  description:
    'Identity & Access indexes (users, roles, permissions, token collections, audit_logs)',
  category: 'index',

  async apply(db: Db): Promise<void> {
    // --- users (docs/03 §9.1.1) — §10.6: login lookup, OTP login/dedupe ---
    await ensureIndex(
      db,
      'users',
      { email: 1 },
      {
        unique: true,
        partialFilterExpression: NOT_DELETED,
        name: 'uniq_email_active',
      },
    );
    // `uniq_phone_active` is CORRECTED BY MIGRATION 0005 — its partial filter there also requires
    // `phone: { $type: 'string' }`, because this filter alone made "no phone" a unique value and
    // capped the platform at one phone-less account. `ensureIndex` leaves 0005's version in place.
    await ensureIndex(
      db,
      'users',
      { phone: 1 },
      {
        unique: true,
        partialFilterExpression: NOT_DELETED,
        name: 'uniq_phone_active',
      },
    );

    // --- roles (docs/03 §9.1.2: `name` unique) / permissions (§9.1.3: `key` unique) ---
    // Both carry the standard audit block (§3) — they are not in §3.1's immutable or ephemeral
    // exception lists — so §3.1's partial-unique rule applies to them exactly as it does to users.
    await ensureIndex(
      db,
      'roles',
      { name: 1 },
      {
        unique: true,
        partialFilterExpression: NOT_DELETED,
        name: 'uniq_role_name_active',
      },
    );
    await ensureIndex(
      db,
      'permissions',
      { key: 1 },
      {
        unique: true,
        partialFilterExpression: NOT_DELETED,
        name: 'uniq_permission_key_active',
      },
    );

    // --- ephemeral auth collections (docs/03 §10.3) — TTL cleanup, hard delete, no soft delete ---
    for (const collection of ['refresh_tokens', 'otp_verifications', 'password_reset_tokens']) {
      await ensureIndex(
        db,
        collection,
        { expiresAt: 1 },
        {
          expireAfterSeconds: 0,
          name: 'ttl_expires_at',
        },
      );
    }

    // refresh_tokens is looked up per user on refresh/revoke-all (docs/02 §9's sequence,
    // docs/09 §2.5's per-device session model) — §9.1.4's userId reference.
    await ensureIndex(db, 'refresh_tokens', { userId: 1 }, { name: 'by_user' });

    // --- audit_logs (docs/03 §9.8.2, §10.6: entity audit trail) — immutable, append-only ---
    await ensureIndex(
      db,
      'audit_logs',
      { entityType: 1, entityId: 1, occurredAt: -1 },
      { name: 'entity_audit_trail' },
    );
  },

  // docs/13 §5.5 — a migration is not complete until its own verification passes.
  async verify(db: Db): Promise<void> {
    const expected: Record<string, string[]> = {
      users: ['uniq_email_active', 'uniq_phone_active'],
      roles: ['uniq_role_name_active'],
      permissions: ['uniq_permission_key_active'],
      refresh_tokens: ['ttl_expires_at', 'by_user'],
      otp_verifications: ['ttl_expires_at'],
      password_reset_tokens: ['ttl_expires_at'],
      audit_logs: ['entity_audit_trail'],
    };

    for (const [collection, indexNames] of Object.entries(expected)) {
      const existing = await db.collection(collection).indexes();
      const existingNames = new Set(existing.map((index) => index.name));
      for (const indexName of indexNames) {
        if (!existingNames.has(indexName)) {
          throw new Error(`Migration 0001 verification failed: ${collection}.${indexName} missing`);
        }
      }
    }
  },
};
