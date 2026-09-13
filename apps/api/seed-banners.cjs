const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    badgeText: { type: String, trim: true },
    ctaText: { type: String, default: 'Explore Now', trim: true },
    linkUrl: { type: String, trim: true },
    secondaryCtaText: { type: String, trim: true },
    secondaryLinkUrl: { type: String, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    mobileImageUrl: { type: String, trim: true },
    placement: {
      type: String,
      enum: ['HOMEPAGE_HERO', 'CATEGORY_TOP', 'PROMO_STRIP', 'COLLECTION_FEATURE'],
      required: true,
      index: true,
    },
    targetCategory: { type: String, trim: true },
    discountCode: { type: String, trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    impressionCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', BannerSchema, 'banners');

const INITIAL_BANNERS = [
  {
    title: 'Artisan Heritage & Architectural Mastery',
    subtitle: 'Handcrafted solid teakwood, Italian aniline leather, and bespoke proportions tailored for Bangalore & Hyderabad luxury residences.',
    badgeText: 'BESPOKE MASTERPIECE',
    ctaText: 'Explore Signature Living',
    linkUrl: '/products',
    secondaryCtaText: 'Book Studio Consultation',
    secondaryLinkUrl: '#design-consultation',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85',
    placement: 'HOMEPAGE_HERO',
    discountCode: 'SPRING2026',
    sortOrder: 1,
    isActive: true,
    impressionCount: 1420,
    clickCount: 104,
  },
  {
    title: 'Turnkey Architectural Interiors & Penthouse Curation',
    subtitle: 'From 3D photorealistic BIM visualization to white-glove artisan installation within 45 days.',
    badgeText: 'VIP RESIDENTIAL SERVICE',
    ctaText: 'Explore Design Portfolio',
    linkUrl: '/portfolio',
    secondaryCtaText: 'Request Site Visit',
    secondaryLinkUrl: '#design-consultation',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2400&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',
    placement: 'HOMEPAGE_HERO',
    sortOrder: 2,
    isActive: true,
    impressionCount: 980,
    clickCount: 68,
  },
  {
    title: 'Handcrafted Dining & Sculptural Centerpieces',
    subtitle: 'Solid American walnut dining tables and bespoke brass pedestals built to endure generations.',
    badgeText: 'CENTURY DINING COLLECTION',
    ctaText: 'View Dining Tables',
    linkUrl: '/products?category=dining',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=2000&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=85',
    placement: 'CATEGORY_TOP',
    targetCategory: 'Dining',
    sortOrder: 1,
    isActive: true,
    impressionCount: 450,
    clickCount: 39,
  },
  {
    title: 'Spring Private Preview: Complimentary 3D VR Concept & ₹25,000 Consultation Privilege',
    badgeText: 'SPRING PRIVILEGE',
    ctaText: 'Claim Privilege',
    linkUrl: '#design-consultation',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    placement: 'PROMO_STRIP',
    discountCode: 'SPRING2026',
    sortOrder: 1,
    isActive: true,
    impressionCount: 3200,
    clickCount: 215,
  },
];

async function seedBanners() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected.');

    console.log('Upserting luxury marketing banners...');
    for (const item of INITIAL_BANNERS) {
      const existing = await Banner.findOne({ title: item.title });
      if (!existing) {
        await Banner.create(item);
        console.log(`+ Created: [${item.placement}] ${item.title}`);
      } else {
        await Banner.updateOne({ _id: existing._id }, { $set: item });
        console.log(`✓ Updated: [${item.placement}] ${item.title}`);
      }
    }

    const total = await Banner.countDocuments();
    console.log(`\nSuccessfully verified ${total} marketing banners in MongoDB.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed banners:', err);
    process.exit(1);
  }
}

seedBanners();
