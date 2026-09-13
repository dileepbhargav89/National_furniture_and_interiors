// Catalog Mongoose schemas — docs/03_database_design.md §9.2.
// autoIndex: false — indexes are managed by packages/database migrations (docs/06 §4.4).
import mongoose, { Schema } from 'mongoose';
import { INVENTORY_MOVEMENT_TYPES, PRODUCT_STATUSES, PRODUCT_TYPES } from '../domain/catalog.types';

// ---- categories -----------------------------------------------------------------------------

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    // docs/03 §9.2.1 — materialized path: full ancestor chain for O(1) subtree lookups.
    ancestors: { type: [Schema.Types.ObjectId], default: [] },
    level: { type: Number, default: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seo: {
      type: {
        title: String,
        description: String,
        keywords: String,
      },
      default: {},
    },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'categories' },
);
categorySchema.set('autoIndex', false);
export const CategoryModel = (mongoose.models.Category ??
  mongoose.model('Category', categorySchema)) as mongoose.Model<Record<string, unknown>>;

// ---- subdocs ----------------------------------------------------------------------------------

const imageSubdocSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    altText: { type: String },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

// ---- product_collections --------------------------------------------------------------------

const productCollectionSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String },
    description: { type: String },
    heroImage: { type: imageSubdocSchema, default: null },
    heroVideo: { type: String },
    thumbnailImage: { type: imageSubdocSchema, default: null },
    galleryImages: { type: [imageSubdocSchema], default: [] },
    galleryVideos: { type: [String], default: [] },
    // Referenced, not embedded — docs/03 §9.2.2.
    productIds: { type: [Schema.Types.ObjectId], default: [] },
    rules: { type: Schema.Types.Mixed, default: null },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    seo: {
      type: { title: String, description: String, keywords: String },
      default: null,
      _id: false,
    },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'product_collections' },
);
productCollectionSchema.set('autoIndex', false);
export const ProductCollectionModel = (mongoose.models.ProductCollection ??
  mongoose.model(
    'ProductCollection',
    productCollectionSchema,
  )) as mongoose.Model<Record<string, unknown>>;

// ---- products -------------------------------------------------------------------------------

const variantSchema = new Schema(
  {
    variantId: { type: Schema.Types.ObjectId, required: true },
    // docs/03 §9.2.4 — globally unique across entire catalog.
    sku: { type: String, required: true },
    attributes: { type: [{ name: String, value: String }], default: [], _id: false },
    priceOverride: {
      type: { amount: Number, currency: String },
      default: null,
      _id: false,
    },
    images: { type: [imageSubdocSchema], default: [] },
    dimensionsOverride: {
      type: { length: Number, width: Number, height: Number, unit: String },
      default: null,
      _id: false,
    },
    weightOverride: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const documentSubdocSchema = new Schema(
  {
    type: { type: String, enum: ['SPEC_SHEET', 'CARE_GUIDE', 'WARRANTY_CARD', 'ASSEMBLY_MANUAL', 'OTHER'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false },
);

const shippingSchema = new Schema(
  {
    type: { type: String, enum: ['STANDARD', 'EXPRESS', 'WHITE_GLOVE', 'FREIGHT', 'PICKUP_ONLY'] },
    estimateDays: { type: String },
    packageWeight: { type: Number },
    availableRegions: { type: [String], default: [] },
  },
  { _id: false },
);

const assemblySchema = new Schema(
  {
    required: { type: Boolean, default: false },
    type: { type: String, enum: ['SELF_ASSEMBLY', 'PROFESSIONAL', 'PRE_ASSEMBLED'] },
    estimatedMinutes: { type: Number },
    fee: { type: Number },
    professionalAvailable: { type: Boolean },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, required: true, unique: true },
    brand: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryIds: { type: [Schema.Types.ObjectId], default: [] },
    description: { type: String, required: true },
    shortDescription: { type: String },
    // ---- Materials & Finishes ----------------------------------------------------------------
    material: { type: String },
    primaryMaterial: { type: String },
    frameMaterial: { type: String },
    finishes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    // ---- Physical specs ---------------------------------------------------------------------
    careInstructions: { type: String },
    warranty: {
      type: { durationMonths: Number, terms: String },
      default: null,
      _id: false,
    },
    dimensions: {
      type: { length: Number, width: Number, height: Number, unit: String },
      default: null,
      _id: false,
    },
    weight: { type: Number },
    // docs/03 §9.2.4 — dynamic category-specific specification fields.
    specifications: { type: Schema.Types.Mixed, default: null },
    // ---- Media ------------------------------------------------------------------------------
    images: { type: [imageSubdocSchema], default: [] },
    videos: {
      type: [{ url: String, publicId: String, title: String }],
      default: [],
      _id: false,
    },
    documents: { type: [documentSubdocSchema], default: [] },
    // docs/03 §9.2.4 — embedded; bounded, always read with product detail.
    variants: { type: [variantSchema], default: [] },
    // ---- Pricing ----------------------------------------------------------------------------
    basePrice: {
      type: { amount: { type: Number, required: true, min: 0 }, currency: String },
      required: true,
      _id: false,
    },
    mrp: {
      type: { amount: { type: Number, min: 0 }, currency: String },
      default: null,
      _id: false,
    },
    taxRate: { type: Number, default: null },
    taxIncluded: { type: Boolean, default: false },
    // ---- Commerce flags ---------------------------------------------------------------------
    // docs/03 §9.2.3 — denormalized for catalog-listing reads without a join.
    ratingsAvg: { type: Number, default: null },
    ratingsCount: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    productType: { type: String, enum: PRODUCT_TYPES, default: null },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'DRAFT' },
    // ---- Customization / Logistics ----------------------------------------------------------
    customization: {
      type: {
        enabled: { type: Boolean, required: true, default: false },
        options: { type: [String], default: [] },
        additionalCost: { type: Number },
        leadTimeDays: { type: Number },
        notes: { type: String },
      },
      default: null,
      _id: false,
    },
    shipping: {
      type: shippingSchema,
      default: null,
    },
    assembly: {
      type: assemblySchema,
      default: null,
    },
    relatedProductIds: { type: [Schema.Types.ObjectId], default: [] },
    // ---- SEO --------------------------------------------------------------------------------
    seo: {
      type: { title: String, description: String, keywords: String },
      default: {},
      _id: false,
    },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'products' },
);

productSchema.index({ status: 1, isDeleted: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ status: 1, isDeleted: 1, categoryId: 1, createdAt: -1 });
productSchema.index({ status: 1, isDeleted: 1, 'basePrice.amount': 1 });

productSchema.set('autoIndex', false);
export const ProductModel = (mongoose.models.Product ??
  mongoose.model('Product', productSchema)) as mongoose.Model<Record<string, unknown>>;

// ---- warehouses -----------------------------------------------------------------------------

const warehouseSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true, default: 'IN' },
    },
    // docs/03 §9.2.5 — 2dsphere index for nearest-warehouse queries.
    geo: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    contactPerson: { type: String },
    contactPhone: { type: String },
    capacity: { type: Number },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'warehouses' },
);
warehouseSchema.set('autoIndex', false);
export const WarehouseModel = (mongoose.models.Warehouse ??
  mongoose.model('Warehouse', warehouseSchema)) as mongoose.Model<Record<string, unknown>>;

// ---- inventory ------------------------------------------------------------------------------

const inventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    // docs/03 §9.2.6 — denormalized for fast lookup without join.
    sku: { type: String, required: true },
    quantityOnHand: { type: Number, required: true, min: 0 },
    quantityReserved: { type: Number, default: 0, min: 0 },
    // docs/03 §9.2.6 — denormalized: onHand - reserved, recomputed on every write.
    quantityAvailable: { type: Number, required: true, min: 0 },
    reorderThreshold: { type: Number, default: 0 },
    lastRestockedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, default: null },
    updatedBy: { type: Schema.Types.ObjectId, default: null },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'inventory' },
);
// docs/03 §9.2.6 — unique compound index prevents duplicate ledger rows.
inventorySchema.set('autoIndex', false);
export const InventoryModel = (mongoose.models.Inventory ??
  mongoose.model('Inventory', inventorySchema)) as mongoose.Model<Record<string, unknown>>;

// ---- inventory_movements --------------------------------------------------------------------

const inventoryMovementSchema = new Schema(
  {
    inventoryId: { type: Schema.Types.ObjectId, required: true },
    productId: { type: Schema.Types.ObjectId, required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    warehouseId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, enum: INVENTORY_MOVEMENT_TYPES, required: true },
    // Signed: positive for additions, negative for removals.
    quantityDelta: { type: Number, required: true },
    referenceType: { type: String },
    referenceId: { type: Schema.Types.ObjectId },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId },
    // docs/03 §9.2.7 — immutable; no updatedAt.
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'inventory_movements' },
);
inventoryMovementSchema.set('autoIndex', false);
export const InventoryMovementModel = (mongoose.models.InventoryMovement ??
  mongoose.model(
    'InventoryMovement',
    inventoryMovementSchema,
  )) as mongoose.Model<Record<string, unknown>>;
