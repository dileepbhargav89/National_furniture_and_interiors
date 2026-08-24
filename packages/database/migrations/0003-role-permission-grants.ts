// Migration 0003 — applies the Phase-1 role -> permission grants approved at the Architecture
// Review of 2026-08-11 (recorded in implementation/03_sprint1_implementation_report.md §2).
//
// Category: `backfill` (docs/13_deployment_strategy.md §5.1). Idempotent: recomputes each role's
// permissionIds[] from the authoritative map below on every run, so re-running converges rather
// than accumulating.
//
// APPROVED DECISIONS APPLIED HERE (none inferred):
//   Q1  users.read_self is an EXPLICIT grant held by all seven roles — not inherent. Preserves
//       roles.permissionIds[] -> permissions.key as the single enforcement source of truth
//       (docs/03 §9.1.2-9.1.3, docs/02 §18's S2 resolution).
//   Q2/Q3  users.read / users.write are SUPER_ADMIN-only.
//   Q5  auth.manage_mfa is SUPER_ADMIN-only (docs/09 §2.8 — MFA re-verification by a SUPER_ADMIN).
//   Q6  admin.manage_roles is SUPER_ADMIN-only (docs/08 §8 "SuperAdmin-only").
//   Q4  admin.view_audit_log is SUPER_ADMIN-only (fail-closed; docs/02 §14 grants SuperAdmin
//       "Full access" and no other role is described as holding audit access).
//   Q7  SUPPORT_AGENT does NOT receive users.read. Its "Customers (read)" scope maps to crm.read
//       on the crm module's `customers` collection (docs/03 §9.7.1, docs/08 §8) — a Phase-3 key.
//
// Every non-listed (role, key) pair is DENIED by absence — docs/09 §2.2's fail-closed principle.
import type { Db } from './types';
import type { Migration } from './types';

/** Authoritative Phase-1 grant map. A role absent from a key's list does not hold it. */
const ROLE_GRANTS: Record<string, readonly string[]> = {
  SUPER_ADMIN: [
    'auth.manage_mfa',
    'users.read_self',
    'users.read',
    'users.write',
    'admin.manage_roles',
    'admin.view_audit_log',
  ],
  SALES_MANAGER: ['users.read_self'],
  DESIGN_MANAGER: ['users.read_self'],
  DESIGNER: ['users.read_self'],
  CATALOG_MANAGER: ['users.read_self'],
  SUPPORT_AGENT: ['users.read_self'],
  CUSTOMER: ['users.read_self'],
};

export const migration: Migration = {
  id: '0003',
  description: 'Apply approved Phase-1 role -> permission grants',
  category: 'backfill',

  async apply(db: Db): Promise<void> {
    const permissionIdByKey = new Map<string, unknown>();
    for (const permission of await db.collection('permissions').find({}).toArray()) {
      permissionIdByKey.set(permission.key as string, permission._id);
    }

    for (const [roleName, keys] of Object.entries(ROLE_GRANTS)) {
      const permissionIds = keys
        .map((key) => permissionIdByKey.get(key))
        .filter((id): id is NonNullable<typeof id> => id !== undefined);

      if (permissionIds.length !== keys.length) {
        throw new Error(
          `Migration 0003: role ${roleName} references a permission key absent from the permissions collection — run 0002 first`,
        );
      }

      // $set (not $setOnInsert): this migration is the authority on grants, so a re-run converges
      // the stored value back onto the approved map rather than leaving drift in place.
      await db
        .collection('roles')
        .updateOne({ name: roleName }, { $set: { permissionIds, updatedAt: new Date() } });
    }
  },

  // docs/13 §5.5 — post-migration validation.
  async verify(db: Db): Promise<void> {
    for (const [roleName, keys] of Object.entries(ROLE_GRANTS)) {
      const role = await db.collection('roles').findOne({ name: roleName });
      if (!role) {
        throw new Error(`Migration 0003 verification failed: role ${roleName} not found`);
      }
      const actual = (role.permissionIds as unknown[]).length;
      if (actual !== keys.length) {
        throw new Error(
          `Migration 0003 verification failed: ${roleName} has ${actual} grants, expected ${keys.length}`,
        );
      }
    }

    // Explicitly assert the fail-closed outcome of Q7 — a regression here would silently widen
    // support-agent access to every staff/admin identity record.
    const supportAgent = await db.collection('roles').findOne({ name: 'SUPPORT_AGENT' });
    const usersRead = await db.collection('permissions').findOne({ key: 'users.read' });
    if (
      supportAgent &&
      usersRead &&
      (supportAgent.permissionIds as { toString(): string }[]).some(
        (id) => id.toString() === (usersRead._id as { toString(): string }).toString(),
      )
    ) {
      throw new Error('Migration 0003 verification failed: SUPPORT_AGENT must not hold users.read');
    }
  },
};
