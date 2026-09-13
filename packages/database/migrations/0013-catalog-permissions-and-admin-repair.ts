/**
 * Migration 0013 — Full authorization repair + catalog.write permission.
 *
 * This migration:
 * 1. Creates catalog.write permission (properly, with key field)
 * 2. Grants catalog.write to SUPER_ADMIN and CATALOG_MANAGER roles
 * 3. Ensures admin@nationalinteriors.local has SUPER_ADMIN role (not CUSTOMER)
 * 4. Ensures SUPER_ADMIN account has userType ADMIN (not CUSTOMER)
 *
 * Idempotent — safe to re-run.
 */
import type { Db, Migration } from './types';

export const migration: Migration = {
  id: '0013',
  description: 'Repair catalog permissions and fix admin account role assignments',
  category: 'backfill',

  async apply(db: Db): Promise<void> {
    const now = new Date();
    const permissions = db.collection('permissions');
    const roles = db.collection('roles');
    const users = db.collection('users');

    // 1. Ensure catalog.write permission exists (with correct `key` field, not `name`)
    const existing = await permissions.findOne({ key: 'catalog.write' });
    let catalogWriteId: unknown;
    
    if (!existing) {
      const res = await permissions.insertOne({
        key: 'catalog.write',
        module: 'catalog',
        description: 'Create, update, and delete catalog items (products, categories, collections, inventory)',
        isDeleted: false,
        version: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: null,
        updatedBy: null,
      });
      catalogWriteId = res.insertedId;
      console.log(`[0013] Created catalog.write permission with id ${catalogWriteId}`);
    } else {
      catalogWriteId = existing._id;
      console.log(`[0013] catalog.write already exists with id ${catalogWriteId}`);
    }

    // Remove any duplicate catalog.write permission that was inserted as string
    // (the previous fix_permissions.ts script may have stored string IDs incorrectly)
    const allCatalogWrite = await permissions.find({ $or: [{ key: 'catalog.write' }, { name: 'catalog.write' }] }).toArray();
    if (allCatalogWrite.length > 1) {
      // Keep only the one with proper key field
      const toDelete = allCatalogWrite.filter(p => p.key !== 'catalog.write');
      for (const p of toDelete) {
        await permissions.deleteOne({ _id: p._id });
        console.log(`[0013] Removed duplicate/broken catalog.write permission ${p._id}`);
      }
    }

    // 2. Grant catalog.write to SUPER_ADMIN and CATALOG_MANAGER
    const rolesToGrant = ['SUPER_ADMIN', 'CATALOG_MANAGER'];
    for (const roleName of rolesToGrant) {
      await roles.updateOne(
        { name: roleName },
        {
          $addToSet: { permissionIds: catalogWriteId },
          $set: { updatedAt: now },
        }
      );
      console.log(`[0013] Granted catalog.write to ${roleName}`);
    }

    // 3. Fix admin account: ensure admin@nationalinteriors.local has SUPER_ADMIN role
    const superAdminRole = await roles.findOne({ name: 'SUPER_ADMIN' });
    if (!superAdminRole) {
      throw new Error('[0013] SUPER_ADMIN role not found');
    }

    // Fix the admin user that was incorrectly assigned CUSTOMER role
    const adminUser = await users.findOne({ email: 'admin@nationalinteriors.local' });
    if (adminUser) {
      const needsRoleFix = adminUser.roleId?.toString() !== superAdminRole._id?.toString();
      if (needsRoleFix || adminUser.userType !== 'ADMIN') {
        await users.updateOne(
          { email: 'admin@nationalinteriors.local' },
          {
            $set: {
              roleId: superAdminRole._id,
              userType: 'ADMIN',
              updatedAt: now,
            },
          }
        );
        console.log('[0013] Fixed admin@nationalinteriors.local: set userType=ADMIN, roleId=SUPER_ADMIN');
      } else {
        console.log('[0013] admin@nationalinteriors.local is already correctly configured');
      }
    }

    // 4. Fix superadmin@antrique.dev - also give SUPER_ADMIN role
    const superAdminUser = await users.findOne({ email: 'superadmin@antrique.dev' });
    if (superAdminUser) {
      const needsRoleFix = superAdminUser.roleId?.toString() !== superAdminRole._id?.toString();
      if (needsRoleFix || superAdminUser.userType !== 'ADMIN') {
        await users.updateOne(
          { email: 'superadmin@antrique.dev' },
          {
            $set: {
              roleId: superAdminRole._id,
              userType: 'ADMIN',
              updatedAt: now,
            },
          }
        );
        console.log('[0013] Fixed superadmin@antrique.dev: set userType=ADMIN, roleId=SUPER_ADMIN');
      } else {
        console.log('[0013] superadmin@antrique.dev is already correctly configured');
      }
    }
    
    console.log('[0013] Authorization repair complete.');
  },

  async verify(db: Db): Promise<void> {
    // Verify catalog.write exists
    const perm = await db.collection('permissions').findOne({ key: 'catalog.write' });
    if (!perm) throw new Error('[0013] catalog.write permission not found');

    // Verify SUPER_ADMIN has catalog.write
    const sa = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
    if (!sa) throw new Error('[0013] SUPER_ADMIN role not found');
    
    const hasCatalogWrite = (sa.permissionIds as unknown[])?.some(
      (id: unknown) => String(id) === String(perm._id)
    );
    if (!hasCatalogWrite) throw new Error('[0013] SUPER_ADMIN missing catalog.write');

    console.log('[0013] Verification passed.');
  },
};
