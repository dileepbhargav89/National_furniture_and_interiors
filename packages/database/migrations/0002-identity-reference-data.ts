// Migration 0002 — the initial `roles` / `permissions` reference data.
//
// This is a MIGRATION, not seed data. docs/13_deployment_strategy.md §5.4 is explicit: "Production
// never receives seed data — the one explicit exception is a genuinely new deployment's minimal
// reference/lookup data (e.g., the initial `roles`/`permissions` documents from
// docs/03_database_design.md §9.1.2-9.1.3...) required for the application to function at all,
// which is itself a migration (Section 5.1's data-backfill category), reviewed and applied exactly
// once at initial Production setup, not a recurring seed-data refresh."
//
// Category: `backfill` (docs/13 §5.1's third change type) — idempotent by upsert, per §5.1's
// "idempotent so a resumed-after-failure backfill never double-applies".
import type { Db } from './types';
import type { Migration } from './types';

/**
 * The seven roles, verbatim from docs/03_database_design.md §9.1.2's `name` enum, confirmed
 * unchanged by docs/02_enterprise_architecture.md §14 and docs/09_security_architecture.md §2.3
 * ("No new role is introduced"). `isSystemRole: true` prevents deletion (§9.1.2).
 */
const SYSTEM_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full access, including User & Role Management' },
  { name: 'SALES_MANAGER', description: 'Leads module; read-only Design Projects and Orders' },
  {
    name: 'DESIGN_MANAGER',
    description: 'Design Projects (full, all designers); Leads (read/assign); Media',
  },
  {
    name: 'DESIGNER',
    description:
      'Own assigned design projects only; read on assigned leads/consultations/site visits',
  },
  { name: 'CATALOG_MANAGER', description: 'Catalog, Inventory, Marketing modules' },
  { name: 'SUPPORT_AGENT', description: 'Orders (read + limited actions); Customers (read)' },
  { name: 'CUSTOMER', description: 'Storefront customer; own profile, cart, orders' },
] as const;

/**
 * Phase-1-relevant permission keys only — the six keys named in docs/08_api_architecture.md §8's
 * `auth` / `users` / `admin` contract rows. Keys for modules that do not exist yet (`leads.read`,
 * `orders.refund`, …) are deliberately NOT pre-seeded: docs/09_security_architecture.md §11 rule 6
 * governs each new key as its own module is built, and seeding keys with no enforcing code would
 * be inventing a permission surface ahead of the module that owns it.
 *
 * Taxonomy: every key is `<module>.<action>` per docs/09 §2.4 — no bare module-name grants.
 */
const PHASE_1_PERMISSIONS = [
  {
    key: 'auth.manage_mfa',
    module: 'auth',
    description: 'Admin-forced MFA reset (docs/08 §8 auth row)',
  },
  {
    key: 'users.read_self',
    module: 'users',
    description: 'Read own profile (docs/08 §8 users row)',
  },
  { key: 'users.read', module: 'users', description: 'Read any user profile (admin, docs/08 §8)' },
  {
    key: 'users.write',
    module: 'users',
    description: 'Update any user profile (admin, docs/08 §8)',
  },
  {
    key: 'admin.manage_roles',
    module: 'admin',
    description: 'Role/permission management (docs/08 §8 admin row)',
  },
  {
    key: 'admin.view_audit_log',
    module: 'admin',
    description: 'Read the audit log (docs/08 §8 admin row)',
  },
] as const;

/**
 * Role -> permission-key assignment.
 *
 * ONLY SUPER_ADMIN is assigned here, and only because it is explicitly and unambiguously specified:
 * docs/02_enterprise_architecture.md §14's role table grants SuperAdmin "Full access, including
 * User & Role Management", and docs/08_api_architecture.md §8's `admin` row confirms role/permission
 * management is "`SuperAdmin`-only".
 *
 * Every other role's grant set across these six keys is NOT specified by any locked document.
 * docs/02 §14's table describes the other roles in terms of business modules (Leads, Design
 * Projects, Catalog, Orders) — none of which have permission keys yet — and says nothing about who
 * besides SuperAdmin may read or write another user's profile. Assigning those mappings here would
 * be inventing an authorization decision, which docs/18_CLAUDE_CONSTITUTION.md §7 Rule 3 forbids.
 * They are therefore left empty and tracked as an open decision in
 * implementation/01_sprint1_prerequisite_remediation.md §11.
 *
 * Consequence, stated plainly: after this migration every non-SUPER_ADMIN role holds zero
 * permission keys. That is the FAIL-CLOSED default docs/09_security_architecture.md §2.2 requires
 * ("any ambiguity... must resolve to 403, never to allowing access by default") — an unspecified
 * grant is absent, not guessed.
 */
const ROLE_PERMISSION_KEYS: Record<string, readonly string[]> = {
  SUPER_ADMIN: PHASE_1_PERMISSIONS.map((permission) => permission.key),
};

export const migration: Migration = {
  id: '0002',
  description: 'Initial roles and permissions reference data (Phase 1 scope)',
  category: 'backfill',

  async apply(db: Db): Promise<void> {
    const now = new Date();
    // docs/03 §3's standard audit block. createdBy/updatedBy are null for system actions.
    const auditFields = {
      createdAt: now,
      updatedAt: now,
      createdBy: null,
      updatedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      version: 0,
    };

    // Upsert-by-natural-key => idempotent (docs/13 §5.1). $setOnInsert never overwrites an
    // operator's later edit to a description or an admin's permission change on re-run.
    for (const permission of PHASE_1_PERMISSIONS) {
      await db
        .collection('permissions')
        .updateOne(
          { key: permission.key },
          { $setOnInsert: { ...permission, ...auditFields } },
          { upsert: true },
        );
    }

    const permissionIdByKey = new Map<string, unknown>();
    for (const permission of await db.collection('permissions').find({}).toArray()) {
      permissionIdByKey.set(permission.key as string, permission._id);
    }

    for (const role of SYSTEM_ROLES) {
      const grantedKeys = ROLE_PERMISSION_KEYS[role.name] ?? [];
      const permissionIds = grantedKeys
        .map((key) => permissionIdByKey.get(key))
        .filter((id): id is NonNullable<typeof id> => id !== undefined);

      await db.collection('roles').updateOne(
        { name: role.name },
        {
          $setOnInsert: {
            name: role.name,
            description: role.description,
            permissionIds,
            isSystemRole: true,
            ...auditFields,
          },
        },
        { upsert: true },
      );
    }
  },

  // docs/13 §5.5 — post-migration validation.
  async verify(db: Db): Promise<void> {
    const roleCount = await db
      .collection('roles')
      .countDocuments({ isSystemRole: true, isDeleted: false });
    if (roleCount !== SYSTEM_ROLES.length) {
      throw new Error(
        `Migration 0002 verification failed: expected ${SYSTEM_ROLES.length} system roles, found ${roleCount}`,
      );
    }

    const permissionCount = await db.collection('permissions').countDocuments({ isDeleted: false });
    if (permissionCount < PHASE_1_PERMISSIONS.length) {
      throw new Error(
        `Migration 0002 verification failed: expected at least ${PHASE_1_PERMISSIONS.length} permissions, found ${permissionCount}`,
      );
    }

    const superAdmin = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
    if (
      !superAdmin ||
      (superAdmin.permissionIds as unknown[]).length < PHASE_1_PERMISSIONS.length
    ) {
      throw new Error(
        'Migration 0002 verification failed: SUPER_ADMIN is missing its permission grants',
      );
    }
  },
};
