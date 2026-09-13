import type { Db, Migration } from './types';

const LEADS_PERMISSIONS = [
  { key: 'leads.read', module: 'leads', description: 'Read leads' },
  { key: 'leads.write', module: 'leads', description: 'Create, update, and assign leads' },
];

const ROLE_GRANTS: Record<string, readonly string[]> = {
  SUPER_ADMIN: ['leads.read', 'leads.write'],
  SALES_MANAGER: ['leads.read', 'leads.write'],
  DESIGN_MANAGER: ['leads.read', 'leads.write'],
  DESIGNER: ['leads.read'],
};

export const migration: Migration = {
  id: '0006',
  description: 'Add Leads module permissions and role grants',
  category: 'backfill',
  
  async apply(db: Db): Promise<void> {
    // 1. Insert permissions idempotently
    for (const p of LEADS_PERMISSIONS) {
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
    for (const p of LEADS_PERMISSIONS) {
      const doc = await db.collection('permissions').findOne({ key: p.key });
      if (!doc) throw new Error(`Migration 0006 failed: ${p.key} not created`);
    }
    const sa = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
    if (!sa) throw new Error('SUPER_ADMIN not found');
  }
};
