const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

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
