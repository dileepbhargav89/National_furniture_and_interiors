const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log('Reading harvested Urban Ladder dataset...');
  const datasetPath = path.resolve(__dirname, '../../scratch/urbanladder_dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error('Dataset not found at:', datasetPath);
    process.exit(1);
  }

  const rawProducts = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  console.log(`Loaded ${rawProducts.length} harvested products!`);

  // Category definitions matching taxonomy
  const categoryDefs = [
    {
      name: 'Sofas & Seating',
      slug: 'sofas',
      description: 'Opulent plush velvet, top-grain leather, and hand-carved solid wood sofas.',
      imageUrl: 'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/LI_jEx8IHH-d.jpg',
      displayOrder: 1,
    },
    {
      name: 'Dining',
      slug: 'dining',
      description: 'Artisanal solid teak dining tables, upholstered dining chairs, and bespoke dining sets.',
      imageUrl: 'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/s45V617L37-2.jpg',
      displayOrder: 2,
    },
    {
      name: 'Beds & Bedroom',
      slug: 'bedroom',
      description: 'Heirloom solid wood bedsteads, hydraulic storage beds, and handcrafted wardrobes.',
      imageUrl: 'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/9J29v45p1m-1.jpg',
      displayOrder: 3,
    },
    {
      name: 'Study & Office',
      slug: 'office',
      description: 'Architectural executive desks, solid wood study tables, and ergonomic office armchairs.',
      imageUrl: 'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/H3e38yJ3k2-1.jpg',
      displayOrder: 4,
    },
    {
      name: 'Living & Storage',
      slug: 'living-room',
      description: 'Handcrafted luxury coffee tables, center tables, TV entertainment units, and shoe cabinets.',
      imageUrl: 'https://cdn.swadeshonline.com/v2/patient-paper-41f385/swad-p/wrkr/products/pictures/item/free/original/O2h5p78j4m-1.jpg',
      displayOrder: 5,
    },
  ];

  console.log('\nEnsuring Categories in MongoDB...');
  const categoryMap = {};

  for (const cat of categoryDefs) {
    let doc = await db.collection('categories').findOne({ slug: cat.slug, isDeleted: false });
    if (!doc) {
      const newId = new mongoose.Types.ObjectId();
      await db.collection('categories').insertOne({
        _id: newId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: null,
        path: cat.slug,
        level: 0,
        imageUrl: cat.imageUrl,
        isActive: true,
        isDeleted: false,
        displayOrder: cat.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      categoryMap[cat.slug] = newId;
      console.log(` Created category: ${cat.name} (${cat.slug}) -> ${newId}`);
    } else {
      categoryMap[cat.slug] = doc._id;
      // update name to be user-friendly if needed
      await db.collection('categories').updateOne(
        { _id: doc._id },
        { $set: { name: cat.name, description: cat.description, isActive: true, isDeleted: false } }
      );
      console.log(` Found category: ${cat.name} (${cat.slug}) -> ${doc._id}`);
    }
  }

  console.log('\nUpserting 76 Urban Ladder Products into MongoDB...');
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const categoryId = categoryMap[p.categorySlug] || categoryMap['living-room'];

    // Ensure unique SKU
    const sku = p.sku || `NFI-UL-${p.slug.slice(0, 16).toUpperCase()}-${i + 1}`;

    const productDoc = {
      name: p.name,
      slug: p.slug,
      sku: sku,
      brand: 'National Furniture & Interiors',
      categoryId: categoryId,
      categoryIds: [categoryId],
      description: p.description,
      shortDescription: p.shortDescription || `Handcrafted ${p.name}`,
      material: p.material || 'Solid Teak Wood',
      primaryMaterial: p.primaryMaterial || 'Solid Wood',
      finishes: p.finishes || ['Natural Teak', 'Dark Walnut'],
      dimensions: p.dimensions || { length: 180, width: 90, height: 75, unit: 'cm' },
      warranty: p.warranty || { durationMonths: 36, terms: 'Comprehensive 36-month warranty against manufacturing defects.' },
      careInstructions: p.careInstructions || 'Wipe with soft cloth. Keep away from direct water contact and extreme heat.',
      images: p.images || [],
      videos: p.videos || [],
      basePrice: p.basePrice,
      mrp: p.mrp,
      ratingsAvg: p.ratingsAvg || 4.8,
      ratingsCount: p.ratingsCount || 28,
      tags: p.tags || ['urban-ladder', 'luxury', p.categorySlug],
      isFeatured: p.isFeatured !== undefined ? p.isFeatured : true,
      isBestSeller: p.isBestSeller !== undefined ? p.isBestSeller : false,
      productType: p.productType || 'READY_TO_SHIP',
      status: 'PUBLISHED',
      isDeleted: false,
      deletedAt: null,
      updatedAt: new Date(),
    };

    const existing = await db.collection('products').findOne({ slug: p.slug });
    if (existing) {
      await db.collection('products').updateOne(
        { _id: existing._id },
        { $set: productDoc }
      );
      updated++;
    } else {
      productDoc._id = new mongoose.Types.ObjectId();
      productDoc.createdAt = new Date();
      await db.collection('products').insertOne(productDoc);
      inserted++;
    }

    if ((i + 1) % 10 === 0 || i === rawProducts.length - 1) {
      console.log(` Processed ${i + 1}/${rawProducts.length} items (${inserted} inserted, ${updated} updated)`);
    }
  }

  console.log('\n--- VERIFYING CATEGORY COUNTS ---');
  for (const cat of categoryDefs) {
    const cId = categoryMap[cat.slug];
    const count = await db.collection('products').countDocuments({ categoryId: cId, isDeleted: false, status: 'PUBLISHED' });
    console.log(` Category: ${cat.name} (${cat.slug}) -> ${count} active products`);
  }

  const totalActive = await db.collection('products').countDocuments({ isDeleted: false, status: 'PUBLISHED' });
  const totalWithVideos = await db.collection('products').countDocuments({
    isDeleted: false,
    status: 'PUBLISHED',
    'videos.0': { $exists: true }
  });

  console.log(`\n========================================`);
  console.log(`TOTAL ACTIVE PRODUCTS: ${totalActive}`);
  console.log(`TOTAL PRODUCTS WITH VIDEO: ${totalWithVideos}`);
  console.log(`========================================`);

  await mongoose.disconnect();
  console.log('Finished successfully!');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
