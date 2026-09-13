import type { Db, Migration } from './types';

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STAFF: 'STAFF',
};

const PERMISSIONS = [
  { name: 'analytics.read', description: 'View analytics dashboards' },
];

export const migration: Migration = {
  id: '0012',
  category: 'backfill',
  description: 'Add initial permissions for Analytics module',

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

    // 3. Grant analytics.read to SUPER_ADMIN and STAFF
    const rolesToUpdate = [ROLES.SUPER_ADMIN, ROLES.STAFF];
    const roles = await rolesCollection.find({ name: { $in: rolesToUpdate } }).toArray();
    
    for (const role of roles) {
      const permsToGrant = [permMap.get('analytics.read')].filter(Boolean);
      await rolesCollection.updateOne(
        { _id: role._id },
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
      throw new Error(`Expected ${PERMISSIONS.length} Analytics permissions, found ${count}`);
    }

    // Verify grants
    const permDocs = await permissionsCollection
      .find({ name: { $in: PERMISSIONS.map((p) => p.name) } })
      .toArray();
    const readPerm = permDocs.find((p) => p.name === 'analytics.read')?._id;

    if (readPerm) {
      const roles = await rolesCollection.find({ name: { $in: [ROLES.SUPER_ADMIN, ROLES.STAFF] } }).toArray();
      for (const role of roles) {
        const hasPerm = role.permissions?.some((p: { equals(other: unknown): boolean }) => p.equals(readPerm));
        if (!hasPerm) {
          throw new Error(`${role.name} role missing analytics.read permission`);
        }
      }
    }
  },
};
