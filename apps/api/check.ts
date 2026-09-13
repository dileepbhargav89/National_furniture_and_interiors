import mongoose from 'mongoose';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected');
  const db = mongoose.connection.db;
  if (db) {
    const users = await db.collection('users').find({ email: 'admin@nationalinteriors.local' }).toArray();
    console.log(users);
  }
  process.exit(0);
}
check().catch(console.error);
