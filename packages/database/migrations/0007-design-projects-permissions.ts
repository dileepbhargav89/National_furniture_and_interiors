import type { Db, Migration } from './types';

const DESIGN_PROJECTS_PERMISSIONS = [
  { key: 'design_projects.read', module: 'design-projects', description: 'Read Design Projects' },
  { key: 'design_projects.write', module: 'design-projects', description: 'Create and update design projects and quotations' },
  { key: 'design_projects.approve_quotation', module: 'design-projects', description: 'Approve design project quotations' },
];

const ROLE_GRANTS: Record<string, readonly string[]> = {
  SUPER_ADMIN: ['design_projects.read', 'design_projects.write', 'design_projects.approve_quotation'],
  DESIGN_MANAGER: ['design_projects.read', 'design_projects.write', 'design_projects.approve_quotation'],
  DESIGNER: ['design_projects.read', 'design_projects.write'],
  SALES_MANAGER: ['design_projects.read'],
};

export const migration: Migration = {
  id: '0007',
  description: 'Add Design Projects module permissions and role grants',
  category: 'backfill',
  
  async apply(db: Db): Promise<void> {
    // 1. Insert permissions idempotently
    for (const p of DESIGN_PROJECTS_PERMISSIONS) {
      await db.collection('permissions').updateOne(
        { key: p.key },
        { 
          $set: { module: p.module, description: p.description },
          $setOnInsert: { createdAt: new Date(), updatedAt: new Date() }
        },
        { upsert: true }
      );
    }

    // 2. Map permission keys to IDs
    const permissionIdByKey = new Map<string, unknown>();
    for (const permission of await db.collection('permissions').find({}).toArray()) {
      permissionIdByKey.set(permission.key as string, permission._id);
    }

    // 3. Grant to roles
    for (const [roleName, keys] of Object.entries(ROLE_GRANTS)) {
      const permissionIds = keys
        .map(key => permissionIdByKey.get(key))
        .filter((id): id is NonNullable<typeof id> => id !== undefined);

      if (permissionIds.length > 0) {
        await db.collection('roles').updateOne(
          { name: roleName },
          { 
            $addToSet: { permissionIds: { $each: permissionIds } },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }
  },

  async verify(db: Db): Promise<void> {
    for (const p of DESIGN_PROJECTS_PERMISSIONS) {
      const doc = await db.collection('permissions').findOne({ key: p.key });
      if (!doc) throw new Error(`Migration 0007 failed: ${p.key} not created`);
    }
    const sa = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
    if (!sa) throw new Error('SUPER_ADMIN not found');
  }
};
