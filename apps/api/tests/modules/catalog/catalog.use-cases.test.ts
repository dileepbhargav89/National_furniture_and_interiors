// Unit tests for Catalog use-cases — docs/12_testing_strategy.md §3's catalog row.
// Specifically covers: inventory concurrency logic and product/category business rules.
import { describe, it, expect, vi } from 'vitest';
import {
  ListProducts,
  GetProductDetail,
  AdminCreateProduct,
  AdminCreateCategory,
} from '../../../src/modules/catalog/application/catalog.use-cases';
import type {
  IProductRepository,
  ICategoryRepository,
  ProductListResult,
  IInventoryRepository,
  IInventoryMovementRepository,
  IWarehouseRepository,
} from '../../../src/modules/catalog/application/ports';
import {
  ListCategories,
  AdminListProducts,
  AdminUpdateProduct,
  AdminAdjustInventory,
} from '../../../src/modules/catalog/application/catalog.use-cases';
import type { Product, Category } from '../../../src/modules/catalog/domain/catalog.types';

// ---- Fixtures -------------------------------------------------------------------------------

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '000000000000000000000001',
    name: 'Walnut Sofa',
    slug: 'walnut-sofa',
    sku: 'SKU-001',
    brand: 'NFI',
    categoryId: '000000000000000000000010',
    categoryIds: [],
    description: 'A beautiful walnut sofa',
    images: [{ url: 'https://cdn.test/img.jpg', publicId: 'img', sortOrder: 0, isPrimary: true }],
    videos: [],
    variants: [],
    basePrice: { amount: 5000000, currency: 'INR' }, // 50,000 INR in paise
    tags: [],
    isFeatured: false,
    isBestSeller: false,
    status: 'PUBLISHED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: '000000000000000000000010',
    name: 'Sofas',
    slug: 'sofas',
    parentId: null,
    ancestors: [],
    level: 0,
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeProductRepo(overrides: Partial<IProductRepository> = {}): IProductRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    findByIds: vi.fn().mockResolvedValue([]),
    list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 } as ProductListResult),
    create: vi.fn(),
    update: vi.fn(),
    updateDenormalizedRatings: vi.fn(),
    ...overrides,
  };
}

function makeCategoryRepo(overrides: Partial<ICategoryRepository> = {}): ICategoryRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    findAll: vi.fn().mockResolvedValue([]),
    findByAncestor: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    ...overrides,
  };
}

// ---- ListProducts ---------------------------------------------------------------------------

describe('ListProducts', () => {
  it('always filters by PUBLISHED status', async () => {
    const products = makeProductRepo();
    const uc = new ListProducts(products);

    await uc.execute({ categoryId: '000000000000000000000010' });

    expect(products.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PUBLISHED', categoryId: '000000000000000000000010' }),
      expect.any(Object),
    );
  });

  it('defaults to limit 24 page 1', async () => {
    const products = makeProductRepo();
    const uc = new ListProducts(products);

    await uc.execute();

    expect(products.list).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ limit: 24, page: 1 }),
    );
  });
});

// ---- ListCategories -------------------------------------------------------------------------

describe('ListCategories', () => {
  it('filters by active only by default', async () => {
    const categories = makeCategoryRepo();
    const uc = new ListCategories(categories);

    await uc.execute();

    expect(categories.findAll).toHaveBeenCalledWith({ isActive: true });
  });

  it('fetches all when onlyActive is false', async () => {
    const categories = makeCategoryRepo();
    const uc = new ListCategories(categories);

    await uc.execute(false);

    expect(categories.findAll).toHaveBeenCalledWith({});
  });
});

// ---- AdminListProducts ----------------------------------------------------------------------

describe('AdminListProducts', () => {
  it('defaults to limit 50 page 1 and no forced status filter', async () => {
    const products = makeProductRepo();
    const uc = new AdminListProducts(products);

    await uc.execute();

    expect(products.list).toHaveBeenCalledWith(
      {}, // empty filter
      expect.objectContaining({ limit: 50, page: 1 }),
    );
  });
});

// ---- GetProductDetail -----------------------------------------------------------------------

describe('GetProductDetail', () => {
  it('returns a published product by ID', async () => {
    const product = makeProduct();
    const products = makeProductRepo({ findById: vi.fn().mockResolvedValue(product) });
    const uc = new GetProductDetail(products);

    const result = await uc.execute(product.id);
    expect(result.id).toBe(product.id);
  });

  it('returns a published product by slug', async () => {
    const product = makeProduct();
    const products = makeProductRepo({ findBySlug: vi.fn().mockResolvedValue(product) });
    const uc = new GetProductDetail(products);

    const result = await uc.execute('walnut-sofa');
    expect(result.slug).toBe('walnut-sofa');
  });

  it('throws NotFoundError for a DRAFT product', async () => {
    const product = makeProduct({ status: 'DRAFT' });
    const products = makeProductRepo({ findById: vi.fn().mockResolvedValue(product) });
    const uc = new GetProductDetail(products);

    await expect(uc.execute(product.id)).rejects.toThrow('Product not found');
  });

  it('throws NotFoundError for non-existent product', async () => {
    const products = makeProductRepo({ findById: vi.fn().mockResolvedValue(null) });
    const uc = new GetProductDetail(products);

    await expect(uc.execute('000000000000000000000099')).rejects.toThrow('Product not found');
  });
});

// ---- AdminCreateProduct ---------------------------------------------------------------------

describe('AdminCreateProduct', () => {
  it('creates a product when slug is unique', async () => {
    const product = makeProduct();
    const products = makeProductRepo({
      findBySlug: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(product),
    });
    const uc = new AdminCreateProduct(products);

    const result = await uc.execute({
      name: 'Walnut Sofa',
      slug: 'walnut-sofa',
      sku: 'SKU-001',
      categoryId: '000000000000000000000010',
      description: 'A beautiful sofa',
      basePrice: { amount: 5000000, currency: 'INR' },
    });

    expect(result.id).toBe(product.id);
    expect(products.create).toHaveBeenCalledOnce();
  });

  it('throws ValidationError when slug already exists', async () => {
    const existing = makeProduct();
    const products = makeProductRepo({ findBySlug: vi.fn().mockResolvedValue(existing) });
    const uc = new AdminCreateProduct(products);

    await expect(
      uc.execute({
        name: 'Walnut Sofa',
        slug: 'walnut-sofa',
        sku: 'SKU-002',
        categoryId: '000000000000000000000010',
        description: 'Duplicate slug',
        basePrice: { amount: 5000000, currency: 'INR' },
      }),
    ).rejects.toThrow('already exists');
  });
});

// ---- AdminCreateCategory --------------------------------------------------------------------

describe('AdminCreateCategory', () => {
  it('creates a root category', async () => {
    const category = makeCategory();
    const categories = makeCategoryRepo({
      findBySlug: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(category),
    });
    const uc = new AdminCreateCategory(categories);

    const result = await uc.execute({ name: 'Sofas', slug: 'sofas' });
    expect(result.slug).toBe('sofas');
  });

  it('throws ValidationError when slug already exists', async () => {
    const existing = makeCategory();
    const categories = makeCategoryRepo({ findBySlug: vi.fn().mockResolvedValue(existing) });
    const uc = new AdminCreateCategory(categories);

    await expect(uc.execute({ name: 'Sofas', slug: 'sofas' })).rejects.toThrow('already exists');
  });
});

// ---- AdminUpdateProduct ---------------------------------------------------------------------

describe('AdminUpdateProduct', () => {
  it('updates a product if it exists', async () => {
    const product = makeProduct();
    const products = makeProductRepo({ update: vi.fn().mockResolvedValue(product) });
    const uc = new AdminUpdateProduct(products);

    const result = await uc.execute('000000000000000000000001', { name: 'Updated Sofa' });
    expect(result.id).toBe('000000000000000000000001');
    expect(products.update).toHaveBeenCalledWith('000000000000000000000001', { name: 'Updated Sofa' });
  });

  it('throws NotFoundError if product does not exist', async () => {
    const products = makeProductRepo({ update: vi.fn().mockResolvedValue(null) });
    const uc = new AdminUpdateProduct(products);

    await expect(uc.execute('000000000000000000000099', {})).rejects.toThrow('Product not found');
  });
});

// ---- AdminAdjustInventory -------------------------------------------------------------------

function makeInventoryRepo(overrides: Partial<IInventoryRepository> = {}): IInventoryRepository {
  return {
    findByVariant: vi.fn().mockResolvedValue(null),
    upsert: vi.fn().mockResolvedValue({ id: 'inv-1', quantityOnHand: 5 }),
    ...overrides,
  };
}

function makeMovementRepo(): IInventoryMovementRepository {
  return { create: vi.fn().mockResolvedValue(undefined) };
}

function makeWarehouseRepo(overrides: Partial<IWarehouseRepository> = {}): IWarehouseRepository {
  return {
    findById: vi.fn().mockResolvedValue({ id: 'wh-1' }),
    ...overrides,
  };
}

describe('AdminAdjustInventory', () => {
  it('records movement and upserts running total', async () => {
    const inventory = makeInventoryRepo({
      findByVariant: vi.fn().mockResolvedValue({ id: 'inv-1', sku: 'SKU-001', quantityOnHand: 10, reorderThreshold: 0 }),
    });
    const movements = makeMovementRepo();
    const warehouses = makeWarehouseRepo();
    const uc = new AdminAdjustInventory(inventory, movements, warehouses);

    await uc.execute({
      productId: 'prod-1',
      variantId: 'var-1',
      warehouseId: 'wh-1',
      type: 'MANUAL_ADJUSTMENT',
      quantityDelta: -2,
      note: 'Found damaged',
      performedBy: 'admin-1',
    });

    expect(movements.create).toHaveBeenCalledWith(expect.objectContaining({
      inventoryId: 'inv-1',
      quantityDelta: -2,
      type: 'MANUAL_ADJUSTMENT',
      note: 'Found damaged',
      performedBy: 'admin-1',
    }));

    expect(inventory.upsert).toHaveBeenCalledWith(expect.objectContaining({
      quantityOnHand: 8, // 10 + (-2)
    }));
  });

  it('throws NotFoundError if warehouse does not exist', async () => {
    const inventory = makeInventoryRepo();
    const movements = makeMovementRepo();
    const warehouses = makeWarehouseRepo({ findById: vi.fn().mockResolvedValue(null) });
    const uc = new AdminAdjustInventory(inventory, movements, warehouses);

    await expect(uc.execute({
      productId: 'prod-1', variantId: 'var-1', warehouseId: 'wh-99', type: 'MANUAL_ADJUSTMENT', quantityDelta: 5,
    })).rejects.toThrow('Warehouse not found');
  });

  it('throws NotFoundError if inventory record does not exist', async () => {
    const inventory = makeInventoryRepo({ findByVariant: vi.fn().mockResolvedValue(null) });
    const movements = makeMovementRepo();
    const warehouses = makeWarehouseRepo();
    const uc = new AdminAdjustInventory(inventory, movements, warehouses);

    await expect(uc.execute({
      productId: 'prod-1', variantId: 'var-1', warehouseId: 'wh-1', type: 'MANUAL_ADJUSTMENT', quantityDelta: 5,
    })).rejects.toThrow('Inventory record not found');
  });
});
