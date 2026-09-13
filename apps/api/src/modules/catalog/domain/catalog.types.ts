// Catalog domain types — docs/03_database_design.md §9.2.
//
// Framework-free: zero imports from express/mongoose/ioredis/bullmq (mechanically enforced by
// @nfi/eslint-config's module-boundary rule).

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type InventoryMovementType =
  | 'ORDER_RESERVED'
  | 'ORDER_COMMITTED'
  | 'ORDER_CANCELLED'
  | 'RESTOCK'
  | 'ADJUSTMENT'
  | 'RETURN';

export const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
export const INVENTORY_MOVEMENT_TYPES: InventoryMovementType[] = [
  'ORDER_RESERVED',
  'ORDER_COMMITTED',
  'ORDER_CANCELLED',
  'RESTOCK',
  'ADJUSTMENT',
  'RETURN',
];

export interface MoneyAmount {
  /** Always stored in the smallest currency unit (paise). docs/03 §2. */
  amount: number;
  currency: string;
}

export interface ImageSubdoc {
  url: string;
  publicId: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | undefined;
  readonly parentId: string | null;
  /** docs/03 §9.2.1 — materialized path; full ancestor chain enabling single-query subtree fetch. */
  readonly ancestors: string[];
  readonly level: number;
  readonly imageUrl: string | undefined;
  readonly isActive: boolean;
  readonly sortOrder: number;
  readonly seo: { title?: string; description?: string; keywords?: string } | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type CollectionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export const COLLECTION_STATUSES: CollectionStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export interface ProductCollection {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly shortDescription: string | undefined;
  readonly description: string | undefined;
  readonly heroImage: ImageSubdoc | undefined;
  readonly heroVideo: string | undefined;
  readonly thumbnailImage: ImageSubdoc | undefined;
  readonly galleryImages: ImageSubdoc[];
  readonly galleryVideos: string[];
  /** Referenced product IDs — docs/03 §9.2.2. */
  readonly productIds: string[];
  readonly rules: Record<string, unknown> | undefined;
  readonly startDate: Date | undefined;
  readonly endDate: Date | undefined;
  readonly status: CollectionStatus;
  readonly featured: boolean;
  readonly sortOrder: number;
  readonly seo: { title?: string; description?: string; keywords?: string } | undefined;
  readonly publishedAt: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** docs/03 §9.2.4 — embedded within a Product document. */
export interface ProductVariant {
  readonly variantId: string;
  /** Unique across the ENTIRE catalog — docs/03 §9.2.4 unique index enforcement. */
  readonly sku: string;
  readonly attributes: ReadonlyArray<{ name: string; value: string }>;
  /** Falls back to product.basePrice if null — docs/03 §9.2.4. */
  readonly priceOverride: MoneyAmount | null;
  readonly images: ReadonlyArray<ImageSubdoc>;
  readonly dimensionsOverride: { length: number; width: number; height: number; unit: string } | undefined;
  readonly weightOverride: number | undefined;
  readonly isActive: boolean;
}

export type ProductType =
  | 'READY_TO_SHIP'
  | 'MADE_TO_ORDER'
  | 'CUSTOM'
  | 'INTERIOR_PRODUCT'
  | 'ACCESSORY';

export const PRODUCT_TYPES: ProductType[] = [
  'READY_TO_SHIP',
  'MADE_TO_ORDER',
  'CUSTOM',
  'INTERIOR_PRODUCT',
  'ACCESSORY',
];

export interface ProductDocument {
  type: 'SPEC_SHEET' | 'CARE_GUIDE' | 'WARRANTY_CARD' | 'ASSEMBLY_MANUAL' | 'OTHER';
  url: string;
  publicId: string;
  label: string;
}

export interface ProductCustomization {
  enabled: boolean;
  options: string[];
  additionalCost?: number;
  leadTimeDays?: number;
  notes?: string;
}

export interface ProductShipping {
  type: 'STANDARD' | 'EXPRESS' | 'WHITE_GLOVE' | 'FREIGHT' | 'PICKUP_ONLY';
  estimateDays: string;
  packageWeight?: number;
  availableRegions?: string[];
}

export interface ProductAssembly {
  required: boolean;
  type?: 'SELF_ASSEMBLY' | 'PROFESSIONAL' | 'PRE_ASSEMBLED';
  estimatedMinutes?: number;
  fee?: number;
  professionalAvailable?: boolean;
}

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly sku: string;
  readonly brand: string | undefined;
  readonly categoryId: string;
  readonly categoryIds: string[];
  readonly description: string;
  readonly shortDescription: string | undefined;
  // ---- Materials & Finishes -------------------------------------------------------------------
  readonly material: string | undefined;
  readonly primaryMaterial: string | undefined;
  readonly frameMaterial: string | undefined;
  readonly finishes: string[];
  readonly colors: string[];
  // ---- Physical specs -------------------------------------------------------------------------
  readonly careInstructions: string | undefined;
  readonly warranty: { durationMonths: number; terms: string } | undefined;
  readonly dimensions: { length: number; width: number; height: number; unit: string } | undefined;
  readonly weight: number | undefined;
  /** Dynamic category-specific specification fields stored as flexible JSON. */
  readonly specifications: Record<string, unknown> | undefined;
  // ---- Media ----------------------------------------------------------------------------------
  readonly images: ReadonlyArray<ImageSubdoc>;
  readonly videos: ReadonlyArray<{ url: string; publicId: string; title?: string }>;
  readonly documents: ReadonlyArray<ProductDocument>;
  // ---- Variants -------------------------------------------------------------------------------
  /** docs/03 §9.2.4 — embedded variants, never a separate collection. */
  readonly variants: ReadonlyArray<ProductVariant>;
  // ---- Pricing --------------------------------------------------------------------------------
  /** Price in paise — docs/03 §2. */
  readonly basePrice: MoneyAmount;
  /** MRP (Maximum Retail Price) in paise — used to show strikethrough / discount. */
  readonly mrp: MoneyAmount | undefined;
  /** GST percentage (e.g. 18 for 18%). Applied on top unless taxIncluded is true. */
  readonly taxRate: number | undefined;
  readonly taxIncluded: boolean | undefined;
  // ---- Commerce flags -------------------------------------------------------------------------
  /** Denormalized from reviews — docs/03 §9.2.3. */
  readonly ratingsAvg: number | undefined;
  readonly ratingsCount: number | undefined;
  readonly tags: string[];
  readonly isFeatured: boolean;
  readonly isBestSeller: boolean;
  readonly productType: ProductType | undefined;
  readonly status: ProductStatus;
  // ---- Customization / Logistics --------------------------------------------------------------
  readonly customization: ProductCustomization | undefined;
  readonly shipping: ProductShipping | undefined;
  readonly assembly: ProductAssembly | undefined;
  /** Referenced IDs of related products for PDP cross-sell. */
  readonly relatedProductIds: string[];
  // ---- SEO ------------------------------------------------------------------------------------
  readonly seo: { title?: string; description?: string; keywords?: string } | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface Warehouse {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly address: {
    line1: string;
    line2: string | undefined;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  readonly geo: { type: 'Point'; coordinates: [number, number] } | undefined;
  readonly contactPerson: string | undefined;
  readonly contactPhone: string | undefined;
  readonly capacity: number | undefined;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * docs/03 §9.2.6 — separate collection; stock changes on every order/restock (far more frequently
 * than product metadata). quantityAvailable is a DENORMALIZED computed field: onHand - reserved.
 */
export interface Inventory {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string;
  readonly warehouseId: string;
  /** Denormalized for fast lookup — docs/03 §9.2.6. */
  readonly sku: string;
  readonly quantityOnHand: number;
  readonly quantityReserved: number;
  readonly quantityAvailable: number;
  readonly reorderThreshold: number;
  readonly lastRestockedAt: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** docs/03 §9.2.7 — immutable, append-only stock ledger. */
export interface InventoryMovement {
  readonly id: string;
  readonly inventoryId: string;
  readonly productId: string;
  readonly variantId: string;
  readonly warehouseId: string;
  readonly type: InventoryMovementType;
  readonly quantityDelta: number;
  readonly referenceType: string | undefined;
  readonly referenceId: string | undefined;
  readonly note: string | undefined;
  readonly performedBy: string | undefined;
  readonly createdAt: Date;
}

// ---- Domain helpers -------------------------------------------------------------------------

/** Returns the effective unit price for a variant (override or product base). */
export function effectiveVariantPrice(variant: ProductVariant, basePrice: MoneyAmount): MoneyAmount {
  return variant.priceOverride ?? basePrice;
}

/** True when the inventory record has at least `qty` units available. */
export function hasStock(inventory: Inventory, qty = 1): boolean {
  return inventory.quantityAvailable >= qty;
}
