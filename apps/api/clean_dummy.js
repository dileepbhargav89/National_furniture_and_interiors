const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const res = await db.collection('products').updateMany(
    { name: /dummy/i },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );
  console.log('Successfully soft-deleted dummy products:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
