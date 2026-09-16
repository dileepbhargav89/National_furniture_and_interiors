/**
 * Seed initial luxury coupons for National Furniture & Interiors
 * Usage: node seed-coupons.cjs
 */
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    applicableCategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'categories' }],
    applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products' }],
    usageLimitTotal: { type: Number, default: 0 },
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'coupons' }
);

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);

const INITIAL_COUPONS = [
  {
    code: 'SPRING2026',
    description: 'Spring Private Preview: 10% privilege discount up to ₹25,000 on luxury commission suites.',
    type: 'PERCENTAGE',
    value: 10,
    minOrderValue: 10000000, // ₹1,00,000 in paise
    maxDiscountAmount: 2500000, // ₹25,000 in paise
    usageLimitTotal: 500,
    usageLimitPerUser: 1,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    isActive: true,
  },
  {
    code: 'EXTRA10K',
    description: 'Bespoke Atelier Bonus: Flat ₹10,000 savings on orders exceeding ₹1,20,000.',
    type: 'FIXED',
    value: 1000000, // ₹10,000 in paise
    minOrderValue: 12000000, // ₹1,20,000 in paise
    maxDiscountAmount: 1000000,
    usageLimitTotal: 1000,
    usageLimitPerUser: 1,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    isActive: true,
  },
  {
    code: 'NFI10',
    description: 'VIP Patron Privilege: 10% discount up to ₹15,000 on solid teakwood & interior furnishings.',
    type: 'PERCENTAGE',
    value: 10,
    minOrderValue: 5000000, // ₹50,000 in paise
    maxDiscountAmount: 1500000, // ₹15,000 in paise
    usageLimitTotal: 2000,
    usageLimitPerUser: 2,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    isActive: true,
  },
  {
    code: 'WELCOME5',
    description: 'First Atelier Order: 5% introductory discount up to ₹7,500 on all handcrafted furniture.',
    type: 'PERCENTAGE',
    value: 5,
    minOrderValue: 2500000, // ₹25,000 in paise
    maxDiscountAmount: 750000, // ₹7,500 in paise
    usageLimitTotal: 5000,
    usageLimitPerUser: 1,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    isActive: true,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    for (const c of INITIAL_COUPONS) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✓ Seeded coupon: ${c.code}`);
    }

    console.log('All coupons seeded successfully.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
