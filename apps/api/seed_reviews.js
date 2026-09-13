const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

const sampleReviews = [
  {
    rating: 5,
    title: 'Exquisite Artisanal Finish & Sublime Comfort',
    content: 'The leather grain has a buttery, tactile hand-feel and the olive tone blends effortlessly with our warm teak floorboards. The delivery team carried it upstairs with white gloves and positioned it perfectly. Worth every rupee.',
    author: 'Vikramaditya Singhania',
    verified: true,
    helpful: 14,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        alt: 'Living Room Setup with Sofa'
      },
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
        alt: 'Close up on leather grain'
      }
    ]
  },
  {
    rating: 5,
    title: 'Mastercrafted Woodworking at its Finest',
    content: 'You can immediately tell the difference with authentic solid kiln-dried timber. The mortise-and-tenon joints are flawless with zero creaking. Outstanding craftsmanship that will easily last a lifetime.',
    author: 'Ananya Deshmukh',
    verified: true,
    helpful: 9,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
        alt: 'Natural sunlight perspective'
      }
    ]
  },
  {
    rating: 4,
    title: 'Impressive Stature and Flawless Packaging',
    content: 'The crating was triple-layered and arrived completely unmarked. High resilience foam provides firm, ergonomic back support. One star off only because delivery took 4 days instead of 3, but the concierge kept me updated throughout.',
    author: 'Capt. Rajesh Nair',
    verified: true,
    helpful: 6,
    images: []
  },
  {
    rating: 5,
    title: 'Centerpiece of our Home — Generates Compliments Daily',
    content: 'We host weekly dinner parties and every single guest remarks on this piece. The bespoke finish is radiant under ambient evening lighting. Truly luxury furniture without the exorbitant European import markups.',
    author: 'Meera & Rohan Kothari',
    verified: true,
    helpful: 21,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
        alt: 'Evening lighting setup'
      }
    ]
  }
];

async function seedReviews() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const products = await db.collection('products').find({ status: 'PUBLISHED' }).toArray();
  console.log(`Seeding reviews across all ${products.length} published products...`);

  let count = 0;
  for (const prod of products) {
    for (let i = 0; i < sampleReviews.length; i++) {
      const template = sampleReviews[i];
      const userId = new mongoose.Types.ObjectId();

      const reviewDoc = {
        productId: prod._id,
        userId: userId,
        rating: template.rating,
        title: template.title,
        content: template.content,
        images: template.images,
        helpfulVotes: template.helpful,
        helpfulVoters: [],
        status: 'APPROVED',
        isVerifiedPurchase: template.verified,
        isFeatured: i === 0,
        userName: template.author,
        productName: prod.name,
        productSku: prod.sku,
        productImage: prod.images?.[0]?.url,
        createdAt: new Date(Date.now() - (i * 86400000 * 3)),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1
      };

      await db.collection('reviews').updateOne(
        { productId: prod._id, title: template.title },
        { $set: reviewDoc },
        { upsert: true }
      );
      count++;
    }

    // Update product ratingsAvg and ratingsCount
    await db.collection('products').updateOne(
      { _id: prod._id },
      {
        $set: {
          ratingsAvg: 4.8,
          ratingsCount: 4
        }
      }
    );
  }

  console.log(`Successfully seeded ${count} luxury reviews and updated ratings across ${products.length} products!`);
  await mongoose.disconnect();
  process.exit(0);
}

seedReviews().catch(err => {
  console.error('Failed to seed reviews:', err);
  process.exit(1);
});
