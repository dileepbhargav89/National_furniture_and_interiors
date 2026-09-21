// Catalog port interfaces — docs/02_enterprise_architecture.md §7.1/§7.3.
// Application depends on these interfaces; Infrastructure implements them.
// docs/06 §4.3: application/ holds "use-case classes… port interfaces".
//
// NOTE: All optional fields use `?: T` (not `T | undefined`) because exactOptionalPropertyTypes
// is enabled. Callers must construct objects explicitly — do not spread objects with undefined
// values into these types.
import type {
  Category,
  Inventory,
  InventoryMovement,
  InventoryMovementType,
  Product,
  ProductCollection,
  ProductCustomization,
  ProductDocument,
  ProductShipping,
  ProductAssembly,
  ProductStatus,
  ProductType,
  Warehouse,
} from '../domain/catalog.types';

// ---- Category -------------------------------------------------------------------------------

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  seo?: { title?: string; description?: string; keywords?: string };
}

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(filter: { isActive?: boolean }): Promise<Category[]>;
  /** Returns all categories in a subtree rooted at `ancestorId` via materialized path. */
  findByAncestor(ancestorId: string): Promise<Category[]>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(id: string, input: Partial<CreateCategoryInput>): Promise<Category | null>;
  softDelete(id: string): Promise<boolean>;
}

// ---- Product Collection ---------------------------------------------------------------------

export interface CreateProductCollectionInput {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  heroImage?: unknown;
  heroVideo?: string;
  thumbnailImage?: unknown;
  galleryImages?: unknown[];
  galleryVideos?: string[];
  productIds?: string[];
  rules?: Record<string, unknown>;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  featured?: boolean;
  sortOrder?: number;
  seo?: { title?: string; description?: string; keywords?: string };
  publishedAt?: Date;
}

export interface IProductCollectionRepository {
  findById(id: string): Promise<ProductCollection | null>;
  findBySlug(slug: string): Promise<ProductCollection | null>;
  findAll(filter: { status?: string; featured?: boolean }): Promise<ProductCollection[]>;
  create(input: CreateProductCollectionInput): Promise<ProductCollection>;
  update(
    id: string,
    input: Partial<CreateProductCollectionInput>,
  ): Promise<ProductCollection | null>;
  softDelete(id: string): Promise<boolean>;
}

// ---- Product --------------------------------------------------------------------------------

export interface ProductListFilter {
  categoryId?: string;
  status?: ProductStatus;
  productType?: ProductType;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  tags?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  inStock?: boolean;
}

export interface ProductListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'basePrice' | 'ratingsAvg' | 'name' | 'featured';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  categoryId: string;
  categoryIds?: string[];
  description: string;
  shortDescription?: string;
  // Materials & Finishes
  material?: string;
  primaryMaterial?: string;
  frameMaterial?: string;
  finishes?: string[];
  colors?: string[];
  careInstructions?: string;
  warranty?: { durationMonths: number; terms: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  weight?: number;
  specifications?: Record<string, unknown>;
  // Pricing
  basePrice: { amount: number; currency: string };
  mrp?: { amount: number; currency: string };
  taxRate?: number;
  taxIncluded?: boolean;
  // Commerce flags
  tags?: string[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  productType?: ProductType;
  status?: ProductStatus;
  // Customization / Logistics
  customization?: ProductCustomization;
  shipping?: ProductShipping;
  assembly?: ProductAssembly;
  relatedProductIds?: string[];
  documents?: ProductDocument[];
  seo?: { title?: string; description?: string; keywords?: string };
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  list(filter: ProductListFilter, options: ProductListOptions): Promise<ProductListResult>;
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: Partial<CreateProductInput>): Promise<Product | null>;
  updateDenormalizedRatings(
    productId: string,
    ratingsAvg: number,
    ratingsCount: number,
  ): Promise<void>;
  softDelete(id: string): Promise<boolean>;
}

// ---- Warehouse ------------------------------------------------------------------------------

export interface IWarehouseRepository {
  findById(id: string): Promise<Warehouse | null>;
  findAll(filter: { isActive?: boolean }): Promise<Warehouse[]>;
}

// ---- Inventory ------------------------------------------------------------------------------

export interface AdjustInventoryInput {
  productId: string;
  variantId: string;
  warehouseId: string;
  type: InventoryMovementType;
  quantityDelta: number;
  note?: string;
  performedBy?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface ReserveStockInput {
  inventoryId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
}

export interface IInventoryRepository {
  findByVariant(
    productId: string,
    variantId: string,
    warehouseId: string,
  ): Promise<Inventory | null>;
  findByProduct(productId: string): Promise<Inventory[]>;
  /**
   * docs/03 §9.2.6 — CRITICAL: reservation MUST be a single atomic conditional update.
   * updateOne({_id, quantityAvailable: {$gte: qty}}, {$inc: {quantityReserved: qty, quantityAvailable: -qty}})
   * Returns false if insufficient stock (zero matched docs), true if reserved successfully.
   */
  atomicReserve(input: ReserveStockInput): Promise<boolean>;
  atomicRelease(inventoryId: string, quantity: number, referenceId: string): Promise<boolean>;
  atomicCommit(inventoryId: string, quantity: number, referenceId: string): Promise<boolean>;
  upsert(input: {
    productId: string;
    variantId: string;
    warehouseId: string;
    sku: string;
    quantityOnHand: number;
    reorderThreshold: number;
  }): Promise<Inventory>;
}

export interface IInventoryMovementRepository {
  create(input: {
    inventoryId: string;
    productId: string;
    variantId: string;
    warehouseId: string;
    type: InventoryMovementType;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: string;
    note?: string;
    performedBy?: string;
  }): Promise<InventoryMovement>;
  findByInventory(inventoryId: string): Promise<InventoryMovement[]>;
}
