// Catalog repositories — docs/02 §7.1 Repository Pattern.
//
// CRITICAL — docs/03 §9.2.6 concurrency rule: inventory reservation MUST be a single atomic
// conditional update. A read-check-then-write would allow two concurrent checkouts for the last
// unit to both pass the stock check. Review Finding D1 (highest-severity DB finding).
//
// docs/03 §3.1: every query applies isDeleted: false unless explicitly querying a trash view.
import mongoose from 'mongoose';
import { cacheService, ICacheService, CACHE_KEYS, CACHE_TTL } from '../../../core/cache';
import type {
  Category,
  Inventory,
  InventoryMovement,
  Product,
  ProductCollection,
  Warehouse,
} from '../domain/catalog.types';
import type {
  CreateCategoryInput,
  CreateProductInput,
  CreateProductCollectionInput,
  IInventoryMovementRepository,
  IInventoryRepository,
  ICategoryRepository,
  IProductCollectionRepository,
  IProductRepository,
  IWarehouseRepository,
  ProductListFilter,
  ProductListOptions,
  ProductListResult,
  ReserveStockInput,
} from '../application/ports';
import {
  CategoryModel,
  InventoryModel,
  InventoryMovementModel,
  ProductCollectionModel,
  ProductModel,
  WarehouseModel,
} from './catalog.schemas';

const OID = /^[0-9a-fA-F]{24}$/;

// ---- Mappers ---------------------------------------------------------------------------------

function toCategory(doc: Record<string, unknown>): Category {
  return {
    id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    description: doc.description as string | undefined,
    parentId: doc.parentId ? String(doc.parentId) : null,
    ancestors: ((doc.ancestors as unknown[]) ?? []).map(String),
    level: doc.level as number,
    imageUrl: doc.imageUrl as string | undefined,
    isActive: doc.isActive as boolean,
    sortOrder: doc.sortOrder as number,
    seo: doc.seo as Category['seo'],
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function reviveCategory(c: Category): Category {
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
}

function reviveProduct(p: Product): Product {
  return {
    ...p,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  };
}

function toProduct(doc: Record<string, unknown>): Product {
  return {
    id: String(doc._id),
    name: doc.name as string,
    slug: doc.slug as string,
    sku: doc.sku as string,
    brand: doc.brand as string | undefined,
    categoryId: String(doc.categoryId),
    categoryIds: ((doc.categoryIds as unknown[]) ?? []).map(String),
    description: doc.description as string,
    shortDescription: doc.shortDescription as string | undefined,
    // ---- Materials & Finishes -------------------------------------------------------------------
    material: doc.material as string | undefined,
    primaryMaterial: doc.primaryMaterial as string | undefined,
    frameMaterial: doc.frameMaterial as string | undefined,
    finishes: (doc.finishes as string[]) ?? [],
    colors: (doc.colors as string[]) ?? [],
    // ---- Physical specs -------------------------------------------------------------------------
    careInstructions: doc.careInstructions as string | undefined,
    warranty: doc.warranty as Product['warranty'],
    dimensions: doc.dimensions as Product['dimensions'],
    weight: doc.weight as number | undefined,
    specifications: doc.specifications as Record<string, unknown> | undefined,
    // ---- Media ----------------------------------------------------------------------------------
    images: (doc.images as Product['images']) ?? [],
    videos: (doc.videos as Product['videos']) ?? [],
    documents: (doc.documents as Product['documents']) ?? [],
    // ---- Variants -------------------------------------------------------------------------------
    variants: ((doc.variants as Record<string, unknown>[]) ?? []).map((v) => ({
      variantId: String(v.variantId),
      sku: v.sku as string,
      attributes: (v.attributes as Product['variants'][0]['attributes']) ?? [],
      priceOverride: v.priceOverride as Product['variants'][0]['priceOverride'],
      images: (v.images as Product['images']) ?? [],
      dimensionsOverride: v.dimensionsOverride as Product['variants'][0]['dimensionsOverride'],
      weightOverride: v.weightOverride as number | undefined,
      isActive: v.isActive as boolean,
    })),
    // ---- Pricing --------------------------------------------------------------------------------
    basePrice: doc.basePrice as Product['basePrice'],
    mrp: doc.mrp as Product['mrp'],
    taxRate: doc.taxRate as number | undefined,
    taxIncluded: doc.taxIncluded as boolean | undefined,
    // ---- Commerce flags -------------------------------------------------------------------------
    ratingsAvg: doc.ratingsAvg as number | undefined,
    ratingsCount: doc.ratingsCount as number | undefined,
    tags: (doc.tags as string[]) ?? [],
    isFeatured: doc.isFeatured as boolean,
    isBestSeller: doc.isBestSeller as boolean,
    productType: doc.productType as Product['productType'],
    status: doc.status as Product['status'],
    // ---- Customization / Logistics --------------------------------------------------------------
    customization: doc.customization as Product['customization'],
    shipping: doc.shipping as Product['shipping'],
    assembly: doc.assembly as Product['assembly'],
    relatedProductIds: ((doc.relatedProductIds as unknown[]) ?? []).map(String),
    // ---- SEO ------------------------------------------------------------------------------------
    seo: doc.seo as Product['seo'],
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function toInventory(doc: Record<string, unknown>): Inventory {
  return {
    id: String(doc._id),
    productId: String(doc.productId),
    variantId: String(doc.variantId),
    warehouseId: String(doc.warehouseId),
    sku: doc.sku as string,
    quantityOnHand: doc.quantityOnHand as number,
    quantityReserved: doc.quantityReserved as number,
    quantityAvailable: doc.quantityAvailable as number,
    reorderThreshold: doc.reorderThreshold as number,
    lastRestockedAt: doc.lastRestockedAt as Date | undefined,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function toInventoryMovement(doc: Record<string, unknown>): InventoryMovement {
  return {
    id: String(doc._id),
    inventoryId: String(doc.inventoryId),
    productId: String(doc.productId),
    variantId: String(doc.variantId),
    warehouseId: String(doc.warehouseId),
    type: doc.type as InventoryMovement['type'],
    quantityDelta: doc.quantityDelta as number,
    referenceType: doc.referenceType as string | undefined,
    referenceId: doc.referenceId ? String(doc.referenceId) : undefined,
    note: doc.note as string | undefined,
    performedBy: doc.performedBy ? String(doc.performedBy) : undefined,
    createdAt: doc.createdAt as Date,
  };
}

function toWarehouse(doc: Record<string, unknown>): Warehouse {
  return {
    id: String(doc._id),
    code: doc.code as string,
    name: doc.name as string,
    address: doc.address as Warehouse['address'],
    geo: doc.geo as Warehouse['geo'],
    contactPerson: doc.contactPerson as string | undefined,
    contactPhone: doc.contactPhone as string | undefined,
    capacity: doc.capacity as number | undefined,
    isActive: doc.isActive as boolean,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function toCollection(doc: Record<string, unknown>): ProductCollection {
  return {
    id: String(doc._id),
    title: doc.title as string,
    slug: doc.slug as string,
    shortDescription: doc.shortDescription as string | undefined,
    description: doc.description as string | undefined,
    heroImage: doc.heroImage as ProductCollection['heroImage'],
    heroVideo: doc.heroVideo as string | undefined,
    thumbnailImage: doc.thumbnailImage as ProductCollection['thumbnailImage'],
    galleryImages: (doc.galleryImages as ProductCollection['galleryImages']) ?? [],
    galleryVideos: (doc.galleryVideos as string[]) ?? [],
    productIds: ((doc.productIds as unknown[]) ?? []).map(String),
    rules: doc.rules as Record<string, unknown> | undefined,
    startDate: doc.startDate as Date | undefined,
    endDate: doc.endDate as Date | undefined,
    status: (doc.status as ProductCollection['status']) || 'DRAFT',
    featured: doc.featured as boolean,
    sortOrder: doc.sortOrder as number,
    seo: doc.seo as ProductCollection['seo'],
    publishedAt: doc.publishedAt as Date | undefined,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function reviveCollection(c: ProductCollection): ProductCollection {
  return {
    ...c,
    startDate: c.startDate ? new Date(c.startDate) : undefined,
    endDate: c.endDate ? new Date(c.endDate) : undefined,
    publishedAt: c.publishedAt ? new Date(c.publishedAt) : undefined,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
  };
}

// ---- CategoryRepository ---------------------------------------------------------------------

export class MongoCategoryRepository implements ICategoryRepository {
  constructor(private readonly cache: ICacheService = cacheService) {}

  async findById(id: string): Promise<Category | null> {
    if (!OID.test(id)) return null;
    const cacheKey = CACHE_KEYS.catalog.categoryDetail(id);
    const cached = await this.cache.get<Category>(cacheKey);
    if (cached) return reviveCategory(cached);

    const doc = await CategoryModel.findOne({ _id: id, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const category = toCategory(doc);
    await this.cache.set(cacheKey, category, CACHE_TTL.CATALOG_DETAIL);
    return category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const cacheKey = CACHE_KEYS.catalog.categoryDetail(`slug:${slug}`);
    const cached = await this.cache.get<Category>(cacheKey);
    if (cached) return reviveCategory(cached);

    const doc = await CategoryModel.findOne({ slug, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const category = toCategory(doc);
    await this.cache.set(cacheKey, category, CACHE_TTL.CATALOG_DETAIL);
    return category;
  }

  async findAll(filter: { isActive?: boolean }): Promise<Category[]> {
    const cacheKey = CACHE_KEYS.catalog.categoryList(filter.isActive);
    const cached = await this.cache.get<Category[]>(cacheKey);
    if (cached) return cached.map(reviveCategory);

    const query: Record<string, unknown> = { isDeleted: false };
    if (filter.isActive !== undefined) query['isActive'] = filter.isActive;
    const docs = await CategoryModel.find(query)
      .sort({ level: 1, sortOrder: 1 })
      .lean<Record<string, unknown>[]>();
    const result = docs.map(toCategory);
    await this.cache.set(cacheKey, result, CACHE_TTL.CATALOG_LIST);
    return result;
  }

  async findByAncestor(ancestorId: string): Promise<Category[]> {
    if (!OID.test(ancestorId)) return [];
    // Materialized path query — docs/03 §9.2.1: single O(1) indexed lookup.
    const docs = await CategoryModel.find({
      ancestors: ancestorId,
      isDeleted: false,
    }).lean<Record<string, unknown>[]>();
    return docs.map(toCategory);
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    let ancestors: string[] = [];
    let level = 0;

    if (input.parentId) {
      const parent = await this.findById(input.parentId);
      if (parent) {
        ancestors = [...parent.ancestors, parent.id];
        level = parent.level + 1;
      }
    }

    const doc = await CategoryModel.create({
      ...input,
      ancestors: ancestors.map((a) => new mongoose.Types.ObjectId(a)),
      level,
    });
    await this.cache.del(
      CACHE_KEYS.catalog.categoryList(),
      CACHE_KEYS.catalog.categoryList(true),
      CACHE_KEYS.catalog.categoryList(false),
    );
    return toCategory(doc.toObject() as Record<string, unknown>);
  }

  async update(id: string, input: Partial<CreateCategoryInput>): Promise<Category | null> {
    if (!OID.test(id)) return null;
    const doc = await CategoryModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: input },
      { new: true },
    ).lean<Record<string, unknown> | null>();
    await this.cache.del(
      CACHE_KEYS.catalog.categoryDetail(id),
      CACHE_KEYS.catalog.categoryList(),
      CACHE_KEYS.catalog.categoryList(true),
      CACHE_KEYS.catalog.categoryList(false),
    );
    if (doc?.slug) {
      await this.cache.del(CACHE_KEYS.catalog.categoryDetail(`slug:${doc.slug as string}`));
    }
    return doc ? toCategory(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!OID.test(id)) return false;
    const existing = await CategoryModel.findOne({ _id: id }).lean<Record<
      string,
      unknown
    > | null>();
    const result = await CategoryModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );
    await this.cache.del(
      CACHE_KEYS.catalog.categoryDetail(id),
      CACHE_KEYS.catalog.categoryList(),
      CACHE_KEYS.catalog.categoryList(true),
      CACHE_KEYS.catalog.categoryList(false),
    );
    if (existing?.slug) {
      await this.cache.del(CACHE_KEYS.catalog.categoryDetail(`slug:${existing.slug as string}`));
    }
    return result.modifiedCount > 0;
  }
}

// ---- ProductCollectionRepository ------------------------------------------------------------

export class MongoProductCollectionRepository implements IProductCollectionRepository {
  constructor(private readonly cache: ICacheService = cacheService) {}

  async findById(id: string): Promise<ProductCollection | null> {
    if (!OID.test(id)) return null;
    const cacheKey = CACHE_KEYS.catalog.collectionDetail(id);
    const cached = await this.cache.get<ProductCollection>(cacheKey);
    if (cached) return reviveCollection(cached);

    const doc = await ProductCollectionModel.findOne({ _id: id, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const collection = toCollection(doc);
    await this.cache.set(cacheKey, collection, CACHE_TTL.CATALOG_DETAIL);
    return collection;
  }

  async findBySlug(slug: string): Promise<ProductCollection | null> {
    const cacheKey = CACHE_KEYS.catalog.collectionDetail(`slug:${slug}`);
    const cached = await this.cache.get<ProductCollection>(cacheKey);
    if (cached) return reviveCollection(cached);

    const doc = await ProductCollectionModel.findOne({ slug, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const collection = toCollection(doc);
    await this.cache.set(cacheKey, collection, CACHE_TTL.CATALOG_DETAIL);
    return collection;
  }

  async findAll(filter: { status?: string; featured?: boolean }): Promise<ProductCollection[]> {
    const cacheKey = CACHE_KEYS.catalog.collectionList(filter.status, filter.featured);
    const cached = await this.cache.get<ProductCollection[]>(cacheKey);
    if (cached) return cached.map(reviveCollection);

    const query: Record<string, unknown> = { isDeleted: false };
    if (filter.status) query['status'] = filter.status;
    if (filter.featured !== undefined) query['featured'] = filter.featured;
    const docs = await ProductCollectionModel.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean<Record<string, unknown>[]>();
    const result = docs.map(toCollection);
    await this.cache.set(cacheKey, result, CACHE_TTL.CATALOG_LIST);
    return result;
  }

  async create(input: CreateProductCollectionInput): Promise<ProductCollection> {
    const doc = await ProductCollectionModel.create(input);
    await this.cache.del(
      CACHE_KEYS.catalog.collectionList(),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', true),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', false),
    );
    return toCollection(doc.toObject() as Record<string, unknown>);
  }

  async update(
    id: string,
    input: Partial<CreateProductCollectionInput>,
  ): Promise<ProductCollection | null> {
    if (!OID.test(id)) return null;
    const doc = await ProductCollectionModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: input },
      { new: true },
    ).lean<Record<string, unknown> | null>();
    await this.cache.del(
      CACHE_KEYS.catalog.collectionDetail(id),
      CACHE_KEYS.catalog.collectionList(),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', true),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', false),
    );
    if (doc?.slug) {
      await this.cache.del(CACHE_KEYS.catalog.collectionDetail(`slug:${doc.slug as string}`));
    }
    return doc ? toCollection(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!OID.test(id)) return false;
    const existing = await ProductCollectionModel.findOne({ _id: id }).lean<Record<
      string,
      unknown
    > | null>();
    const result = await ProductCollectionModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, status: 'ARCHIVED' } },
    );
    await this.cache.del(
      CACHE_KEYS.catalog.collectionDetail(id),
      CACHE_KEYS.catalog.collectionList(),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', true),
      CACHE_KEYS.catalog.collectionList('PUBLISHED', false),
    );
    if (existing?.slug) {
      await this.cache.del(CACHE_KEYS.catalog.collectionDetail(`slug:${existing.slug as string}`));
    }
    return result.modifiedCount > 0;
  }
}

// ---- ProductRepository -----------------------------------------------------------------------

export class MongoProductRepository implements IProductRepository {
  constructor(private readonly cache: ICacheService = cacheService) {}

  async findById(id: string): Promise<Product | null> {
    if (!OID.test(id)) return null;
    const cacheKey = CACHE_KEYS.catalog.productDetail(id);
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) return reviveProduct(cached);

    const doc = await ProductModel.findOne({ _id: id, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const product = toProduct(doc);
    await this.cache.set(cacheKey, product, CACHE_TTL.CATALOG_DETAIL);
    return product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const cacheKey = CACHE_KEYS.catalog.productDetail(`slug:${slug}`);
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) return reviveProduct(cached);

    const doc = await ProductModel.findOne({ slug, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const product = toProduct(doc);
    await this.cache.set(cacheKey, product, CACHE_TTL.CATALOG_DETAIL);
    return product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const validIds = ids.filter((id) => OID.test(id));
    if (validIds.length === 0) return [];
    const docs = await ProductModel.find({ _id: { $in: validIds }, isDeleted: false }).lean<
      Record<string, unknown>[]
    >();
    return docs.map(toProduct);
  }

  async list(filter: ProductListFilter, options: ProductListOptions): Promise<ProductListResult> {
    const query: Record<string, unknown> = { isDeleted: false };
    if (filter.status) query['status'] = filter.status;
    if (filter.productType) query['productType'] = filter.productType;
    const andClauses: Record<string, unknown>[] = [];

    if (filter.categoryId) {
      const catOid = new mongoose.Types.ObjectId(filter.categoryId);
      andClauses.push({
        $or: [{ categoryId: catOid }, { categoryIds: catOid }],
      });
    }

    if (filter.isFeatured !== undefined) query['isFeatured'] = filter.isFeatured;
    if (filter.isBestSeller !== undefined) query['isBestSeller'] = filter.isBestSeller;
    if (filter.tags?.length) query['tags'] = { $in: filter.tags };
    if (filter.material) {
      const cleanMat = filter.material.slice(0, 100).trim();
      if (cleanMat) {
        const escapedMat = cleanMat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query['material'] = { $regex: escapedMat, $options: 'i' };
      }
    }
    if (filter.inStock) {
      query['status'] = 'PUBLISHED';
      query['variants.isActive'] = true;
    }
    if (filter.minPrice !== undefined) query['basePrice.amount'] = { $gte: filter.minPrice };
    if (filter.maxPrice !== undefined) {
      query['basePrice.amount'] = {
        ...((query['basePrice.amount'] as object) ?? {}),
        $lte: filter.maxPrice,
      };
    }
    if (filter.search) {
      const cleanSearch = filter.search.slice(0, 100).trim();
      if (cleanSearch) {
        const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        andClauses.push({
          $or: [
            { name: regex },
            { description: regex },
            { sku: regex },
            { tags: { $in: [regex] } },
            { material: regex },
          ],
        });
      }
    }

    if (andClauses.length > 0) {
      query['$and'] = andClauses;
    }

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 24)); // docs/08 §5.3: max 100
    const skip = (page - 1) * limit;

    let sortSpec: Record<string, 1 | -1> = { createdAt: -1 };
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    if (options.sortBy === 'featured') {
      sortSpec = { isFeatured: -1, createdAt: -1 };
    } else if (options.sortBy === 'basePrice') {
      sortSpec = { 'basePrice.amount': sortDir, createdAt: -1 };
    } else if (options.sortBy === 'ratingsAvg') {
      sortSpec = { ratingsAvg: -1, ratingsCount: -1 };
    } else if (options.sortBy === 'name') {
      sortSpec = { name: sortDir };
    } else if (options.sortBy === 'createdAt') {
      sortSpec = { createdAt: sortDir };
    }

    const cacheFilterStr = Buffer.from(
      JSON.stringify({ filter, sortBy: options.sortBy, sortOrder: options.sortOrder, limit }),
    ).toString('base64url');
    const cacheKey = CACHE_KEYS.catalog.productList(page, cacheFilterStr);
    const cached = await this.cache.get<ProductListResult>(cacheKey);
    if (cached) {
      return {
        ...cached,
        items: cached.items.map(reviveProduct),
      };
    }

    const [docs, total] = await Promise.all([
      ProductModel.find(query)
        .sort(sortSpec)
        .skip(skip)
        .limit(limit)
        .lean<Record<string, unknown>[]>(),
      ProductModel.countDocuments(query),
    ]);

    const result: ProductListResult = { items: docs.map(toProduct), total, page, limit };
    await this.cache.set(cacheKey, result, CACHE_TTL.CATALOG_LIST);
    return result;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const doc = await ProductModel.create({
      ...input,
      categoryId: new mongoose.Types.ObjectId(input.categoryId),
      categoryIds: (input.categoryIds ?? []).map((id) => new mongoose.Types.ObjectId(id)),
    });
    return toProduct(doc.toObject() as Record<string, unknown>);
  }

  async update(id: string, input: Partial<CreateProductInput>): Promise<Product | null> {
    if (!OID.test(id)) return null;
    const doc = await ProductModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: input },
      { new: true },
    ).lean<Record<string, unknown> | null>();
    if (doc) {
      await this.cache.del(
        CACHE_KEYS.catalog.productDetail(id),
        CACHE_KEYS.catalog.productDetail(`slug:${doc.slug as string}`),
      );
    }
    return doc ? toProduct(doc) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    if (!OID.test(id)) return false;
    const doc = await ProductModel.findOne({ _id: id, isDeleted: false }).lean<Record<
      string,
      unknown
    > | null>();
    const result = await ProductModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
    );
    if (doc) {
      await this.cache.del(
        CACHE_KEYS.catalog.productDetail(id),
        CACHE_KEYS.catalog.productDetail(`slug:${doc.slug as string}`),
      );
    }
    return result.modifiedCount > 0;
  }

  async updateDenormalizedRatings(
    productId: string,
    ratingsAvg: number,
    ratingsCount: number,
  ): Promise<void> {
    if (!OID.test(productId)) return;
    await ProductModel.updateOne({ _id: productId }, { $set: { ratingsAvg, ratingsCount } });
    await this.cache.del(CACHE_KEYS.catalog.productDetail(productId));
  }
}

// ---- WarehouseRepository --------------------------------------------------------------------

export class MongoWarehouseRepository implements IWarehouseRepository {
  async findById(id: string): Promise<Warehouse | null> {
    if (!OID.test(id)) return null;
    const doc = await WarehouseModel.findOne({ _id: id }).lean<Record<string, unknown> | null>();
    return doc ? toWarehouse(doc) : null;
  }

  async findAll(filter: { isActive?: boolean }): Promise<Warehouse[]> {
    const query: Record<string, unknown> = {};
    if (filter.isActive !== undefined) query['isActive'] = filter.isActive;
    const docs = await WarehouseModel.find(query).lean<Record<string, unknown>[]>();
    return docs.map(toWarehouse);
  }
}

// ---- InventoryRepository --------------------------------------------------------------------

export class MongoInventoryRepository implements IInventoryRepository {
  async findByVariant(
    productId: string,
    variantId: string,
    warehouseId: string,
  ): Promise<Inventory | null> {
    const doc = await InventoryModel.findOne({
      productId: new mongoose.Types.ObjectId(productId),
      variantId: new mongoose.Types.ObjectId(variantId),
      warehouseId: new mongoose.Types.ObjectId(warehouseId),
    }).lean<Record<string, unknown> | null>();
    return doc ? toInventory(doc) : null;
  }

  async findByProduct(productId: string): Promise<Inventory[]> {
    if (!OID.test(productId)) return [];
    const docs = await InventoryModel.find({
      productId: new mongoose.Types.ObjectId(productId),
    }).lean<Record<string, unknown>[]>();
    return docs.map(toInventory);
  }

  /**
   * docs/03 §9.2.6 — CRITICAL CONCURRENCY: single atomic conditional update.
   * This is the ONLY correct implementation; a read-check-then-write would allow overselling.
   * Returns true if reservation succeeded (matched doc with sufficient stock), false otherwise.
   */
  async atomicReserve(input: ReserveStockInput): Promise<boolean> {
    if (!OID.test(input.inventoryId)) return false;

    const result = await InventoryModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(input.inventoryId),
        // Guard: only proceed if stock is actually available.
        quantityAvailable: { $gte: input.quantity },
      },
      {
        $inc: {
          quantityReserved: input.quantity,
          quantityAvailable: -input.quantity,
        },
      },
    );

    return result.matchedCount === 1;
  }

  /** Releases reserved stock back to available (e.g. on order cancellation). */
  async atomicRelease(
    inventoryId: string,
    quantity: number,
    _referenceId: string,
  ): Promise<boolean> {
    if (!OID.test(inventoryId)) return false;

    const result = await InventoryModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(inventoryId),
        quantityReserved: { $gte: quantity },
      },
      {
        $inc: {
          quantityReserved: -quantity,
          quantityAvailable: quantity,
        },
      },
    );

    return result.matchedCount === 1;
  }

  /** Commits reserved stock to permanent onHand decrement (called on payment webhook confirm). */
  async atomicCommit(
    inventoryId: string,
    quantity: number,
    _referenceId: string,
  ): Promise<boolean> {
    if (!OID.test(inventoryId)) return false;

    const result = await InventoryModel.updateOne(
      {
        _id: new mongoose.Types.ObjectId(inventoryId),
        quantityReserved: { $gte: quantity },
      },
      {
        $inc: {
          quantityReserved: -quantity,
          quantityOnHand: -quantity,
          // quantityAvailable stays the same — reserved was already subtracted at reserve time.
        },
      },
    );

    return result.matchedCount === 1;
  }

  async upsert(input: {
    productId: string;
    variantId: string;
    warehouseId: string;
    sku: string;
    quantityOnHand: number;
    reorderThreshold: number;
  }): Promise<Inventory> {
    const filter = {
      productId: new mongoose.Types.ObjectId(input.productId),
      variantId: new mongoose.Types.ObjectId(input.variantId),
      warehouseId: new mongoose.Types.ObjectId(input.warehouseId),
    };

    const doc = await InventoryModel.findOneAndUpdate(
      filter,
      {
        $set: {
          sku: input.sku,
          quantityOnHand: input.quantityOnHand,
          reorderThreshold: input.reorderThreshold,
          // Recompute the denormalized field.
        },
        $setOnInsert: {
          quantityReserved: 0,
        },
      },
      { upsert: true, new: true },
    ).lean<Record<string, unknown>>();

    // Recompute denormalized quantityAvailable after upsert.
    const upd = await InventoryModel.findOneAndUpdate(
      filter,
      [{ $set: { quantityAvailable: { $subtract: ['$quantityOnHand', '$quantityReserved'] } } }],
      { new: true },
    ).lean<Record<string, unknown> | null>();

    return toInventory((upd ?? doc) as Record<string, unknown>);
  }
}

// ---- InventoryMovementRepository ------------------------------------------------------------

export class MongoInventoryMovementRepository implements IInventoryMovementRepository {
  async create(
    input: Parameters<IInventoryMovementRepository['create']>[0],
  ): Promise<InventoryMovement> {
    const doc = await InventoryMovementModel.create({
      inventoryId: new mongoose.Types.ObjectId(input.inventoryId),
      productId: new mongoose.Types.ObjectId(input.productId),
      variantId: new mongoose.Types.ObjectId(input.variantId),
      warehouseId: new mongoose.Types.ObjectId(input.warehouseId),
      type: input.type,
      quantityDelta: input.quantityDelta,
      referenceType: input.referenceType,
      referenceId: input.referenceId ? new mongoose.Types.ObjectId(input.referenceId) : undefined,
      note: input.note,
      performedBy: input.performedBy ? new mongoose.Types.ObjectId(input.performedBy) : undefined,
    });
    return toInventoryMovement(doc.toObject() as Record<string, unknown>);
  }

  async findByInventory(inventoryId: string): Promise<InventoryMovement[]> {
    if (!OID.test(inventoryId)) return [];
    const docs = await InventoryMovementModel.find({
      inventoryId: new mongoose.Types.ObjectId(inventoryId),
    })
      .sort({ createdAt: -1 })
      .lean<Record<string, unknown>[]>();
    return docs.map(toInventoryMovement);
  }
}
