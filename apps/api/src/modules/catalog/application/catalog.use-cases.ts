// Catalog use-cases — docs/06 §4.3: application/ "use-case classes… no infrastructure imports".
// All cross-module dependencies are satisfied through port interfaces declared in ports.ts.
import { NotFoundError, ValidationError } from '../../../core/exceptions';
import type {
  Category,
  Inventory,
  Product,
  ProductCollection,
} from '../domain/catalog.types';
import type {
  AdjustInventoryInput,
  CreateCategoryInput,
  CreateProductInput,
  CreateProductCollectionInput,
  ICategoryRepository,
  IProductCollectionRepository,
  IInventoryMovementRepository,
  IInventoryRepository,
  IProductRepository,
  IWarehouseRepository,
  ProductListFilter,
  ProductListOptions,
  ProductListResult,
} from './ports';

// ---- Public: List Categories ----------------------------------------------------------------

export class ListCategories {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(onlyActive = true): Promise<Category[]> {
    // exactOptionalPropertyTypes: only pass the key when we have a real value.
    if (onlyActive) {
      return this.categories.findAll({ isActive: true });
    }
    return this.categories.findAll({});
  }
}

// ---- Public: Get Category -------------------------------------------------------------------

export class GetCategory {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(idOrSlug: string): Promise<Category> {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const category = isId
      ? await this.categories.findById(idOrSlug)
      : await this.categories.findBySlug(idOrSlug);

    if (!category || !category.isActive) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }
}

// ---- Public: List Products ------------------------------------------------------------------

export class ListProducts {
  constructor(private readonly products: IProductRepository) {}

  async execute(
    filter?: ProductListFilter,
    options?: ProductListOptions,
  ): Promise<ProductListResult> {
    // Public listing always scoped to published products — admin use a separate use-case.
    const baseFilter: ProductListFilter = { ...(filter ?? {}), status: 'PUBLISHED' };
    const baseOptions: ProductListOptions = { limit: 24, page: 1, ...(options ?? {}) };
    return this.products.list(baseFilter, baseOptions);
  }
}

// ---- Public: Get Product Detail -------------------------------------------------------------

export class GetProductDetail {
  constructor(private readonly products: IProductRepository) {}

  async execute(idOrSlug: string): Promise<Product> {
    // Try ID first (24-char hex), then slug.
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = isId
      ? await this.products.findById(idOrSlug)
      : await this.products.findBySlug(idOrSlug);

    if (!product || product.status !== 'PUBLISHED') {
      throw new NotFoundError('Product not found');
    }
    return product;
  }
}

// ---- Admin: List Products (all statuses) ----------------------------------------------------

export class AdminListProducts {
  constructor(private readonly products: IProductRepository) {}

  async execute(
    filter?: ProductListFilter,
    options?: ProductListOptions,
  ): Promise<ProductListResult> {
    const baseOptions: ProductListOptions = { limit: 50, page: 1, ...(options ?? {}) };
    return this.products.list(filter ?? {}, baseOptions);
  }
}

// ---- Admin: Create Category -----------------------------------------------------------------

export class AdminCreateCategory {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.categories.findBySlug(input.slug);
    if (existing) {
      throw new ValidationError('A category with this slug already exists');
    }
    return this.categories.create(input);
  }
}

// ---- Admin: Update Category -----------------------------------------------------------------

export class AdminUpdateCategory {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(id: string, input: Partial<CreateCategoryInput>): Promise<Category> {
    // If slug is being updated, check for collision
    if (input.slug) {
      const existing = await this.categories.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ValidationError('A category with this slug already exists');
      }
    }
    const updated = await this.categories.update(id, input);
    if (!updated) {
      throw new NotFoundError('Category not found');
    }
    return updated;
  }
}

// ---- Admin: Get Category --------------------------------------------------------------------

export class AdminGetCategory {
  constructor(private readonly categories: ICategoryRepository) {}

  async execute(idOrSlug: string): Promise<Category> {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const category = isId
      ? await this.categories.findById(idOrSlug)
      : await this.categories.findBySlug(idOrSlug);

    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }
}

// ---- Admin: Delete Category -----------------------------------------------------------------

export class AdminDeleteCategory {
  constructor(
    private readonly categories: ICategoryRepository,
    private readonly products: IProductRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if any products use this category
    const productsRes = await this.products.list({ categoryId: id }, { limit: 1 });
    if (productsRes.total > 0) {
      throw new ValidationError('Cannot delete category because it has products assigned to it.');
    }

    const deleted = await this.categories.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Category not found');
    }
  }
}

// ---- Admin: Create Product ------------------------------------------------------------------

export class AdminCreateProduct {
  constructor(private readonly products: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existing = await this.products.findBySlug(input.slug);
    if (existing) {
      throw new ValidationError('A product with this slug already exists');
    }
    return this.products.create(input);
  }
}

// ---- Admin: Update Product ------------------------------------------------------------------

export class AdminUpdateProduct {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string, input: Partial<CreateProductInput>): Promise<Product> {
    const updated = await this.products.update(id, input);
    if (!updated) {
      throw new NotFoundError('Product not found');
    }
    return updated;
  }
}

// ---- Admin: Get Product Detail --------------------------------------------------------------

export class AdminGetProduct {
  constructor(private readonly products: IProductRepository) {}

  async execute(idOrSlug: string): Promise<Product> {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const product = isId
      ? await this.products.findById(idOrSlug)
      : await this.products.findBySlug(idOrSlug);

    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }
}

// ---- Admin: Archive Product -----------------------------------------------------------------

export class AdminArchiveProduct {
  constructor(private readonly products: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.products.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Product not found');
    }
  }
}

// ---- Admin: Adjust Inventory ----------------------------------------------------------------

export class AdminAdjustInventory {
  constructor(
    private readonly inventory: IInventoryRepository,
    private readonly movements: IInventoryMovementRepository,
    private readonly warehouses: IWarehouseRepository,
  ) {}

  async execute(input: AdjustInventoryInput): Promise<Inventory> {
    const warehouse = await this.warehouses.findById(input.warehouseId);
    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    const existing = await this.inventory.findByVariant(
      input.productId,
      input.variantId,
      input.warehouseId,
    );

    if (!existing) {
      throw new NotFoundError('Inventory record not found for this variant/warehouse combination');
    }

    // Record the movement first (immutable append-only ledger — docs/03 §9.2.7).
    // Build explicitly to satisfy exactOptionalPropertyTypes.
    const movementInput: Parameters<IInventoryMovementRepository['create']>[0] = {
      inventoryId: existing.id,
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      type: input.type,
      quantityDelta: input.quantityDelta,
    };
    if (input.referenceType !== undefined) movementInput.referenceType = input.referenceType;
    if (input.referenceId !== undefined) movementInput.referenceId = input.referenceId;
    if (input.note !== undefined) movementInput.note = input.note;
    if (input.performedBy !== undefined) movementInput.performedBy = input.performedBy;

    await this.movements.create(movementInput);

    // Upsert the running totals.
    return this.inventory.upsert({
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      sku: existing.sku,
      quantityOnHand: existing.quantityOnHand + input.quantityDelta,
      reorderThreshold: existing.reorderThreshold,
    });
  }
}

// ---- Public: List Collections ---------------------------------------------------------------

export class ListCollections {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(): Promise<ProductCollection[]> {
    return this.collections.findAll({ status: 'PUBLISHED' });
  }
}

// ---- Public: Get Collection Detail ----------------------------------------------------------

export class GetCollectionDetail {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(idOrSlug: string): Promise<ProductCollection> {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const collection = isId
      ? await this.collections.findById(idOrSlug)
      : await this.collections.findBySlug(idOrSlug);

    if (!collection || collection.status !== 'PUBLISHED') {
      throw new NotFoundError('Collection not found');
    }
    return collection;
  }
}

// ---- Admin: List Collections ----------------------------------------------------------------

export class AdminListCollections {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(): Promise<ProductCollection[]> {
    return this.collections.findAll({});
  }
}

// ---- Admin: Get Collection Detail -----------------------------------------------------------

export class AdminGetCollection {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(idOrSlug: string): Promise<ProductCollection> {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    const collection = isId
      ? await this.collections.findById(idOrSlug)
      : await this.collections.findBySlug(idOrSlug);

    if (!collection) {
      throw new NotFoundError('Collection not found');
    }
    return collection;
  }
}

// ---- Admin: Create Collection ---------------------------------------------------------------

export class AdminCreateCollection {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(input: CreateProductCollectionInput): Promise<ProductCollection> {
    const exists = await this.collections.findBySlug(input.slug);
    if (exists) {
      throw new ValidationError('A collection with this slug already exists.');
    }
    return this.collections.create(input);
  }
}

// ---- Admin: Update Collection ---------------------------------------------------------------

export class AdminUpdateCollection {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(id: string, input: Partial<CreateProductCollectionInput>): Promise<ProductCollection> {
    const updated = await this.collections.update(id, input);
    if (!updated) {
      throw new NotFoundError('Collection not found');
    }
    return updated;
  }
}

// ---- Admin: Delete Collection ---------------------------------------------------------------

export class AdminDeleteCollection {
  constructor(private readonly collections: IProductCollectionRepository) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.collections.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Collection not found');
    }
  }
}
