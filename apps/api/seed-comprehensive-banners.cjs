const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://Nationalinteriors_app:Niwali8174%23@cluster0.w1hyrzh.mongodb.net/nfi_dev?appName=Cluster0';

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

const COMPREHENSIVE_BANNERS = [
  // 1. HOMEPAGE_HERO #1 - Flagship Artisan Living
  {
    title: 'Artisan Heritage & Architectural Mastery',
    subtitle: 'Handcrafted solid teakwood, Italian aniline leather, and bespoke proportions tailored for Bangalore & Hyderabad luxury residences.',
    badgeText: 'BESPOKE MASTERPIECE',
    ctaText: 'Explore Signature Living',
    linkUrl: '/products?category=living-room',
    secondaryCtaText: 'Book Studio Consultation',
    secondaryLinkUrl: '#design-consultation',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2400&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85',
    placement: 'HOMEPAGE_HERO',
    discountCode: 'SPRING2026',
    sortOrder: 1,
    isActive: true,
    impressionCount: 2450,
    clickCount: 188,
  },
  // 2. HOMEPAGE_HERO #2 - Turnkey Architectural Penthouse Curation
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
    impressionCount: 1890,
    clickCount: 142,
  },
  // 3. HOMEPAGE_HERO #3 - Imperial Bedroom Suites
  {
    title: 'The Imperial Teakwood Bedroom Suite',
    subtitle: 'Hand-carved solid Burma teak frames paired with Belgian linen upholstery and brushed brass accents.',
    badgeText: 'HERITAGE ATELIER',
    ctaText: 'View Bedroom Suites',
    linkUrl: '/products?category=bedroom',
    secondaryCtaText: 'Custom Dimensions',
    secondaryLinkUrl: '#design-consultation',
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=2400&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=85',
    placement: 'HOMEPAGE_HERO',
    discountCode: 'IMPERIAL10',
    sortOrder: 3,
    isActive: true,
    impressionCount: 1240,
    clickCount: 96,
  },
  // 4. CATEGORY_TOP #1 - Living Room
  {
    title: 'Sculptural Living & Modular Lounge Suites',
    subtitle: 'Ergonomically contoured silhouettes with high-density down feather cushioning and stain-resistant velvet.',
    badgeText: 'LIVING ROOM ARCHITECTURE',
    ctaText: 'Shop Living Collection',
    linkUrl: '/products?category=living',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=2000&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=85',
    placement: 'CATEGORY_TOP',
    targetCategory: 'Living',
    sortOrder: 1,
    isActive: true,
    impressionCount: 920,
    clickCount: 74,
  },
  // 5. CATEGORY_TOP #2 - Dining Collection
  {
    title: 'Handcrafted Dining & Sculptural Centerpieces',
    subtitle: 'Solid American walnut dining tables with live edge profiles and bespoke brass pedestals built to endure generations.',
    badgeText: 'CENTURY DINING COLLECTION',
    ctaText: 'View Dining Tables',
    linkUrl: '/products?category=dining',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=2000&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=85',
    placement: 'CATEGORY_TOP',
    targetCategory: 'Dining',
    sortOrder: 2,
    isActive: true,
    impressionCount: 810,
    clickCount: 65,
  },
  // 6. PROMO_STRIP #1 - Spring Urgency Privilege
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
    impressionCount: 4820,
    clickCount: 385,
  },
  // 7. COLLECTION_FEATURE #1 - Milano Noir
  {
    title: 'The Milano Noir Atelier Edit: Minimalist Architectural Brutalism',
    subtitle: 'Matte black stained ash, raw travertine stone, and unlacquered brass accents engineered for high-end urban spaces.',
    badgeText: 'CURATED ATELIER EDIT',
    ctaText: 'Explore The Edit',
    linkUrl: '/collections/milano-noir',
    secondaryCtaText: 'Download Lookbook',
    secondaryLinkUrl: '/lookbook',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=85',
    placement: 'COLLECTION_FEATURE',
    discountCode: 'MILANO15',
    sortOrder: 1,
    isActive: true,
    impressionCount: 1530,
    clickCount: 128,
  },
  // 8. COLLECTION_FEATURE #2 - Svenska Minimal
  {
    title: 'Svenska Minimal: Scandinavian Warmth in Natural White Oak',
    subtitle: 'Understated elegance, certified sustainable timbers, and soft organic bouclé textures.',
    badgeText: 'LIMITED RUN',
    ctaText: 'View Collection',
    linkUrl: '/collections/svenska',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=85',
    mobileImageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=85',
    placement: 'COLLECTION_FEATURE',
    sortOrder: 2,
    isActive: true,
    impressionCount: 1120,
    clickCount: 89,
  },
];

async function seedComprehensiveBanners() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to database.');

    console.log('Upserting 8 luxury conversion banners across all placements...');
    for (const item of COMPREHENSIVE_BANNERS) {
      const existing = await Banner.findOne({ title: item.title });
      if (!existing) {
        await Banner.create(item);
        console.log(`+ Created: [${item.placement}] ${item.title}`);
      } else {
        await Banner.updateOne({ _id: existing._id }, { $set: item });
        console.log(`✓ Updated: [${item.placement}] ${item.title}`);
      }
    }

    const countByPlacement = await Banner.aggregate([
      { $group: { _id: '$placement', count: { $sum: 1 }, totalImpressions: { $sum: '$impressionCount' }, totalClicks: { $sum: '$clickCount' } } },
    ]);

    console.log('\n--- Banner Inventory Summary by Placement ---');
    countByPlacement.forEach((group) => {
      const ctr = group.totalImpressions > 0 ? ((group.totalClicks / group.totalImpressions) * 100).toFixed(2) : '0.00';
      console.log(`• ${group._id}: ${group.count} banners | Impressions: ${group.totalImpressions} | Clicks: ${group.totalClicks} | CTR: ${ctr}%`);
    });

    const total = await Banner.countDocuments();
    console.log(`\nTotal active marketing banners in database: ${total}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed comprehensive banners:', err);
    process.exit(1);
  }
}

seedComprehensiveBanners();
