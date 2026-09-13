const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';

async function updateSofas() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  await db.collection('categories').updateOne(
    { slug: 'sofas' },
    { $set: { level: 0, parentId: null, ancestors: [], displayOrder: 1, sortOrder: 1 } }
  );
  console.log('Successfully promoted Sofas & Seating to level 0 (top-level category)!');
  await mongoose.disconnect();
}

updateSofas();
