const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function mapSubcategories() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const categories = await db.collection('categories').find({ isDeleted: false }).toArray();
  const catBySlug = {};
  categories.forEach(c => { catBySlug[c.slug] = c._id; });

  const products = await db.collection('products').find({ isDeleted: false }).toArray();
  console.log(`Processing ${products.length} products for subcategory enrichment...`);

  let updated = 0;

  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    const additionalCatIds = [];

    // Dining
    if (nameLower.includes('dining table') || nameLower.includes('dining set')) {
      if (catBySlug['dining-tables']) additionalCatIds.push(catBySlug['dining-tables']);
    } else if (nameLower.includes('dining chair') || nameLower.includes('chair')) {
      if (catBySlug['dining-chairs']) additionalCatIds.push(catBySlug['dining-chairs']);
    }

    // Bedroom
    if (nameLower.includes('bed')) {
      if (catBySlug['beds']) additionalCatIds.push(catBySlug['beds']);
    } else if (nameLower.includes('wardrobe')) {
      if (catBySlug['wardrobes']) additionalCatIds.push(catBySlug['wardrobes']);
    } else if (nameLower.includes('nightstand') || nameLower.includes('bedside')) {
      if (catBySlug['nightstands']) additionalCatIds.push(catBySlug['nightstands']);
    } else if (nameLower.includes('drawer') || nameLower.includes('dresser')) {
      if (catBySlug['dressers']) additionalCatIds.push(catBySlug['dressers']);
    }

    // Office
    if (nameLower.includes('table') || nameLower.includes('desk')) {
      if (catBySlug['desks']) additionalCatIds.push(catBySlug['desks']);
    } else if (nameLower.includes('chair')) {
      if (catBySlug['office-chairs']) additionalCatIds.push(catBySlug['office-chairs']);
    } else if (nameLower.includes('book') || nameLower.includes('shelf')) {
      if (catBySlug['bookcases']) additionalCatIds.push(catBySlug['bookcases']);
    }

    // Living
    if (nameLower.includes('coffee table') || nameLower.includes('center table')) {
      if (catBySlug['coffee-tables']) additionalCatIds.push(catBySlug['coffee-tables']);
    } else if (nameLower.includes('tv') || nameLower.includes('media')) {
      if (catBySlug['tv-units']) additionalCatIds.push(catBySlug['tv-units']);
    }

    // Combine with existing categoryIds
    const allIds = [p.categoryId, ...additionalCatIds].filter(Boolean);
    const uniqueIds = [...new Set(allIds.map(String))].map(id => new mongoose.Types.ObjectId(id));

    await db.collection('products').updateOne(
      { _id: p._id },
      { $set: { categoryIds: uniqueIds } }
    );
    updated++;
  }

  console.log(`Enriched ${updated} products with subcategories!`);

  // Print counts
  console.log('\n--- VERIFYING SUBCATEGORY COUNTS ---');
  for (const c of categories) {
    const count = await db.collection('products').countDocuments({
      isDeleted: false,
      status: 'PUBLISHED',
      $or: [{ categoryId: c._id }, { categoryIds: c._id }]
    });
    console.log(` ${c.name} (${c.slug}) -> ${count} products`);
  }

  await mongoose.disconnect();
}

mapSubcategories().catch(console.error);
