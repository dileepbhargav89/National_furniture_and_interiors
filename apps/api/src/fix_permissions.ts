import { connect, connection, Types } from 'mongoose';
import { env } from 'process';

async function fixPermissions() {
  console.log("Connecting to database using MONGODB_URI...");
  try {
    if (!env.MONGODB_URI) {
      console.log("No MONGODB_URI provided in environment.");
      process.exit(1);
    }
    await connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("SUCCESS: Database is connected successfully!");
    
    const db = connection.db;
    if (db) {
      // 1. Find or create catalog.write permission
      let catalogWritePerm = await db.collection('permissions').findOne({ key: 'catalog.write' });
      if (!catalogWritePerm) {
        // Some permissions used `name` instead of `key` by mistake in the DB, we'll check both
        catalogWritePerm = await db.collection('permissions').findOne({ name: 'catalog.write' });
      }

      let permId;
      if (!catalogWritePerm) {
        console.log("Creating catalog.write permission...");
        const result = await db.collection('permissions').insertOne({
          _id: new Types.ObjectId(),
          key: 'catalog.write',
          description: 'Create and update products and categories in the catalog',
          module: 'catalog',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          version: 0
        });
        permId = result.insertedId;
      } else {
        console.log("Found catalog.write permission.");
        permId = catalogWritePerm._id;
      }

      // 2. Assign to SUPER_ADMIN
      const superAdminRole = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
      if (superAdminRole && !superAdminRole.permissionIds?.some((id: any) => id.toString() === permId.toString())) {
        console.log("Assigning to SUPER_ADMIN...");
        await db.collection('roles').updateOne(
          { name: 'SUPER_ADMIN' },
          { $push: { permissionIds: permId.toString() } as any } // The previous script showed they are stored as strings for some reason, wait let's check
        );
      }

      // Assign to CATALOG_MANAGER
      const catalogManagerRole = await db.collection('roles').findOne({ name: 'CATALOG_MANAGER' });
      if (catalogManagerRole && !catalogManagerRole.permissionIds?.some((id: any) => id.toString() === permId.toString())) {
        console.log("Assigning to CATALOG_MANAGER...");
        await db.collection('roles').updateOne(
          { name: 'CATALOG_MANAGER' },
          { $push: { permissionIds: permId.toString() } as any }
        );
      }

      console.log("Permissions fixed successfully.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("FAILED to connect to the database:");
    console.error(error);
    process.exit(1);
  }
}

fixPermissions();
