import { connect, connection } from 'mongoose';
import { env } from 'process';


async function checkDatabase() {
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
      const roles = await db.collection('roles').find({}).toArray();
      const permissions = await db.collection('permissions').find({}).toArray();
      const users = await db.collection('users').find({}).toArray();
      
      console.log("ROLES:", JSON.stringify(roles, null, 2));
      console.log("PERMISSIONS:", JSON.stringify(permissions, null, 2));
      console.log("USERS:", JSON.stringify(users.map(u => ({ email: u.email, roleId: u.roleId, roleName: u.roleName })), null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error("FAILED to connect to the database:");
    console.error(error);
    process.exit(1);
  }
}

checkDatabase();
