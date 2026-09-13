const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const email = 'admin@nfi.com';
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // 1. Ensure SUPER_ADMIN role exists
  let role = await db.collection('roles').findOne({ name: 'SUPER_ADMIN' });
  if (!role) {
    const roleInsert = await db.collection('roles').insertOne({
      _id: new mongoose.Types.ObjectId(),
      name: 'SUPER_ADMIN',
      description: 'Super Administrator',
      permissionIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    role = { _id: roleInsert.insertedId };
  }

  // 2. Add full catalog permissions to SUPER_ADMIN role if missing
  const perms = await db.collection('permissions').find({ name: { $in: ['catalog.write', 'catalog.read'] } }).toArray();
  const permIds = perms.map(p => p._id);
  await db.collection('roles').updateOne(
    { _id: role._id },
    { $addToSet: { permissionIds: { $each: permIds } } }
  );

  // 3. Upsert admin user
  const user = await db.collection('users').findOne({ email });
  if (user) {
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash: hashedPassword,
          roleId: role._id,
          isActive: true,
          status: 'ACTIVE',
          isDeleted: false,
          mfaEnabled: false,
          updatedAt: new Date()
        }
      }
    );
    console.log(`Updated existing user ${email}`);
  } else {
    await db.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId(),
      email,
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: role._id,
      userType: 'ADMIN',
      isActive: true,
      mfaEnabled: false,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(`Created new user ${email}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
