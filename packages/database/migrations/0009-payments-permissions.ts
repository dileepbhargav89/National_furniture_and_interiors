// 0009-payments-permissions.ts — Seeds the payments module permission.
// docs/08_api_architecture.md §9: payments.read is the only admin-facing permission for this module.
// Webhook endpoint has no JWT permission — it is authenticated by Razorpay signature only.

import type { Db, Migration } from './types';

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
};

const PERMISSIONS = [
  { name: 'payments.read', description: 'View all payment records (Admin only)' },
];

export const migration: Migration = {
  id: '0009',
  category: 'backfill',
  description: 'Add initial permissions for Payments module',

  async apply(db: Db): Promise<void> {
    const permissionsCollection = db.collection('permissions');
    const rolesCollection = db.collection('roles');

    // 1. Create the permissions (idempotent upsert)
    for (const p of PERMISSIONS) {
      await permissionsCollection.updateOne(
        { name: p.name },
        { $setOnInsert: { name: p.name, description: p.description, createdAt: new Date() } },
        { upsert: true }
      );
    }

    // 2. Fetch permission IDs
    const permDocs = await permissionsCollection
      .find({ name: { $in: PERMISSIONS.map((p) => p.name) } })
      .toArray();
    const permMap = new Map(permDocs.map((d) => [d.name, d._id]));

    // 3. Grant payments.read to SUPER_ADMIN only
    //    (payments data is financial — never exposed to CUSTOMER or DESIGNER roles)
    const adminRole = await rolesCollection.findOne({ name: ROLES.SUPER_ADMIN });
    if (adminRole) {
      const permsToGrant = [permMap.get('payments.read')].filter(Boolean);
      await rolesCollection.updateOne(
        { _id: adminRole._id },
        { $addToSet: { permissions: { $each: permsToGrant } } }
      );
    }
  },

  async verify(db: Db): Promise<void> {
    const permissionsCollection = db.collection('permissions');
    const rolesCollection = db.collection('roles');

    // Verify permission was created
    const count = await permissionsCollection.countDocuments({
      name: { $in: PERMISSIONS.map((p) => p.name) },
    });
    if (count !== PERMISSIONS.length) {
      throw new Error(`Expected ${PERMISSIONS.length} payments permissions, found ${count}`);
    }

    // Verify SUPER_ADMIN grant
    const permDocs = await permissionsCollection
      .find({ name: { $in: PERMISSIONS.map((p) => p.name) } })
      .toArray();
    const readPerm = permDocs.find((p) => p.name === 'payments.read')?._id;

    if (readPerm) {
      const adminRole = await rolesCollection.findOne({ name: ROLES.SUPER_ADMIN });
      if (adminRole) {
        const hasPerm = adminRole.permissions?.some((p: { equals(other: unknown): boolean }) => p.equals(readPerm));
        if (!hasPerm) {
          throw new Error('SUPER_ADMIN role missing payments.read permission');
        }
      }
    }
  },
};
