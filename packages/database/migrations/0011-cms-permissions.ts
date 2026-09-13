import type { Db, Migration } from './types';

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CATALOG_MANAGER: 'CATALOG_MANAGER',
};

const PERMISSIONS = [
  { name: 'cms.write', description: 'Create, update, or delete CMS content.' },
];

export const migration: Migration = {
  id: '0011',
  category: 'backfill',
  description: 'Add initial permissions for CMS module',

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

    // 3. Grant cms.write to SUPER_ADMIN and CATALOG_MANAGER
    const rolesToUpdate = [ROLES.SUPER_ADMIN, ROLES.CATALOG_MANAGER];
    const roles = await rolesCollection.find({ name: { $in: rolesToUpdate } }).toArray();
    
    for (const role of roles) {
      const permsToGrant = [permMap.get('cms.write')].filter(Boolean);
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
      throw new Error(`Expected ${PERMISSIONS.length} CMS permissions, found ${count}`);
    }

    // Verify grants
    const permDocs = await permissionsCollection
      .find({ name: { $in: PERMISSIONS.map((p) => p.name) } })
      .toArray();
    const writePerm = permDocs.find((p) => p.name === 'cms.write')?._id;

    if (writePerm) {
      const roles = await rolesCollection.find({ name: { $in: [ROLES.SUPER_ADMIN, ROLES.CATALOG_MANAGER] } }).toArray();
      for (const role of roles) {
        const hasPerm = role.permissions?.some((p: { equals(other: unknown): boolean }) => p.equals(writePerm));
        if (!hasPerm) {
          throw new Error(`${role.name} role missing cms.write permission`);
        }
      }
    }
  },
};
