import type { Db, Migration } from './types';

const ROLES = {
  CUSTOMER: 'CUSTOMER',
  SUPER_ADMIN: 'SUPER_ADMIN',
};

const PERMISSIONS = [
  { name: 'orders.read_self', description: 'Read own orders' },
  { name: 'orders.write', description: 'Manage and update orders (Admin)' },
];

export const migration: Migration = {
  id: '0008',
  category: 'backfill',
  description: 'Add initial permissions for Orders module',
  
  async apply(db: Db): Promise<void> {
    const permissionsCollection = db.collection('permissions');
    const rolesCollection = db.collection('roles');
    
    // 1. Create the new permissions
    for (const p of PERMISSIONS) {
      await permissionsCollection.updateOne(
        { name: p.name },
        { $setOnInsert: { name: p.name, description: p.description, createdAt: new Date() } },
        { upsert: true }
      );
    }
    
    // 2. Fetch permission IDs
    const permDocs = await permissionsCollection.find({ name: { $in: PERMISSIONS.map(p => p.name) } }).toArray();
    const permMap = new Map(permDocs.map(d => [d.name, d._id]));
    
    // 3. Grant to roles
    const customerRole = await rolesCollection.findOne({ name: ROLES.CUSTOMER });
    if (customerRole) {
      const permsToGrant = [permMap.get('orders.read_self')];
      await rolesCollection.updateOne(
        { _id: customerRole._id },
        { $addToSet: { permissions: { $each: permsToGrant.filter(Boolean) } } }
      );
    }
    
    const adminRole = await rolesCollection.findOne({ name: ROLES.SUPER_ADMIN });
    if (adminRole) {
      const permsToGrant = [permMap.get('orders.read_self'), permMap.get('orders.write')];
      await rolesCollection.updateOne(
        { _id: adminRole._id },
        { $addToSet: { permissions: { $each: permsToGrant.filter(Boolean) } } }
      );
    }
  },
  
  async verify(db: Db): Promise<void> {
    const permissionsCollection = db.collection('permissions');
    const rolesCollection = db.collection('roles');
    
    // Verify permissions exist
    const count = await permissionsCollection.countDocuments({ name: { $in: PERMISSIONS.map(p => p.name) } });
    if (count !== PERMISSIONS.length) {
      throw new Error(`Expected ${PERMISSIONS.length} orders permissions, found ${count}`);
    }
    
    // Verify grants
    const permDocs = await permissionsCollection.find({ name: { $in: PERMISSIONS.map(p => p.name) } }).toArray();
    const customerPerm = permDocs.find(p => p.name === 'orders.read_self')?._id;
    
    if (customerPerm) {
      const customerRole = await rolesCollection.findOne({ name: ROLES.CUSTOMER });
      if (customerRole) {
        const hasPerm = customerRole.permissions?.some((p: { equals(other: unknown): boolean }) => p.equals(customerPerm));
        if (!hasPerm) {
          throw new Error('CUSTOMER role missing orders.read_self permission');
        }
      }
    }
  }
};
