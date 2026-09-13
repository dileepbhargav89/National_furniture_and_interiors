const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';

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
