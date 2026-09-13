// Catalog controllers — docs/06 §4.3: presentation/ calls application/ use-cases only.
// docs/08 §8: catalog row — no auth on public GET; catalog.write on admin mutations.
//
// All filter/options objects are built explicitly (not spread from Zod outputs) because
// exactOptionalPropertyTypes is enabled: spreading a Zod result that contains `undefined`
// fields into an interface with optional `?:` fields is a type error.
import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import type {
  AdminAdjustInventory,
  AdminCreateCategory,
  AdminCreateProduct,
  AdminListProducts,
  AdminUpdateProduct,
  AdminGetProduct,
  AdminArchiveProduct,
  GetProductDetail,
  ListCategories,
  ListProducts,
  AdminUpdateCategory,
  AdminGetCategory,
  AdminDeleteCategory,
  GetCategory,
} from '../application/catalog.use-cases';
import type { AdjustInventoryInput, ProductListFilter, ProductListOptions } from '../application/ports';
import {
  adjustInventorySchema,
  createCategorySchema,
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
  updateCategorySchema,
  createCollectionSchema,
  updateCollectionSchema,
} from './catalog.validators';

export interface CatalogControllerDeps {
  listCategories: ListCategories;
  listProducts: ListProducts;
  getProductDetail: GetProductDetail;
  adminListProducts: AdminListProducts;
  adminCreateProduct: AdminCreateProduct;
  adminUpdateProduct: AdminUpdateProduct;
  adminGetProduct: AdminGetProduct;
  adminArchiveProduct: AdminArchiveProduct;
  adminCreateCategory: AdminCreateCategory;
  adminUpdateCategory: AdminUpdateCategory;
  adminGetCategory: AdminGetCategory;
  adminDeleteCategory: AdminDeleteCategory;
  getCategory: GetCategory;
  adminAdjustInventory: AdminAdjustInventory;
  listCollections: any;
  getCollectionDetail: any;
  adminListCollections: any;
  adminGetCollection: any;
  adminCreateCollection: any;
  adminUpdateCollection: any;
  adminDeleteCollection: any;
}

/** Builds a ProductListFilter from a parsed query, only setting keys that have real values. */
function buildFilter(q: ReturnType<typeof listProductsQuerySchema.parse>): ProductListFilter {
  const filter: ProductListFilter = {};
  if (q.categoryId !== undefined) filter.categoryId = q.categoryId;
  if (q.productType !== undefined) filter.productType = q.productType;
  if (q.isFeatured !== undefined) filter.isFeatured = q.isFeatured;
  if (q.isBestSeller !== undefined) filter.isBestSeller = q.isBestSeller;
  if (q.tags !== undefined) filter.tags = q.tags;
  if (q.search !== undefined) filter.search = q.search;
  if (q.material !== undefined) filter.material = q.material;
  if (q.inStock !== undefined) filter.inStock = q.inStock;
  if (q.minPrice !== undefined) filter.minPrice = q.minPrice;
  if (q.maxPrice !== undefined) filter.maxPrice = q.maxPrice;
  return filter;
}

function buildOptions(q: ReturnType<typeof listProductsQuerySchema.parse>): ProductListOptions {
  const options: ProductListOptions = { page: q.page, limit: q.limit };
  if (q.sortBy !== undefined) options.sortBy = q.sortBy;
  if (q.sortOrder !== undefined) options.sortOrder = q.sortOrder;
  return options;
}

export function createCatalogController(deps: CatalogControllerDeps) {
  return {
    // ---- Public: Categories -------------------------------------------------------------------

    /** GET /categories */
    async listCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const categories = await deps.listCategories.execute(true);
        sendSuccess(req, res, 200, categories);
      } catch (error) {
        next(error);
      }
    },

    /** GET /categories/:slug */
    async getCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const category = await deps.getCategory.execute(req.params['slug'] as string);
        sendSuccess(req, res, 200, category);
      } catch (error) {
        next(error);
      }
    },

    // ---- Public: Products ---------------------------------------------------------------------

    /** GET /products */
    async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listProductsQuerySchema.parse(req.query);
        const result = await deps.listProducts.execute(buildFilter(query), buildOptions(query));
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    },

    /** GET /products/:id */
    async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const product = await deps.getProductDetail.execute(req.params['id'] as string);
        sendSuccess(req, res, 200, product);
      } catch (error) {
        next(error);
      }
    },

    // ---- Admin: Products -----------------------------------------------------------------------

    /** GET /admin/products */
    async adminListProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listProductsQuerySchema.parse(req.query);
        const result = await deps.adminListProducts.execute(buildFilter(query), buildOptions(query));
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    },

    /** GET /admin/products/:id */
    async adminGetProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const product = await deps.adminGetProduct.execute(req.params['id'] as string);
        sendSuccess(req, res, 200, product);
      } catch (error) {
        next(error);
      }
    },

    /** POST /admin/products */
    async adminCreateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = createProductSchema.parse(req.body);
        // Build explicitly — do not spread Zod output that may contain undefined optional keys.
        const input = {
          name: body.name,
          slug: body.slug,
          sku: body.sku,
          categoryId: body.categoryId,
          description: body.description,
          basePrice: body.basePrice,
          ...(body.brand !== undefined ? { brand: body.brand } : {}),
          ...(body.categoryIds !== undefined ? { categoryIds: body.categoryIds } : {}),
          ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription } : {}),
          ...(body.material !== undefined ? { material: body.material } : {}),
          ...(body.careInstructions !== undefined ? { careInstructions: body.careInstructions } : {}),
          ...(body.warranty !== undefined ? { warranty: body.warranty } : {}),
          ...(body.dimensions !== undefined ? { dimensions: body.dimensions } : {}),
          ...(body.weight !== undefined ? { weight: body.weight } : {}),
          ...(body.tags !== undefined ? { tags: body.tags } : {}),
          ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
          ...(body.isBestSeller !== undefined ? { isBestSeller: body.isBestSeller } : {}),
          ...(body.documents !== undefined ? { documents: body.documents } : {}),
          ...(body.images !== undefined ? { images: body.images } : {}),
          ...(body.variants !== undefined ? { variants: body.variants } : {}),
          ...(body.relatedProductIds !== undefined ? { relatedProductIds: body.relatedProductIds } : {}),
          ...(body.productType !== undefined ? { productType: body.productType } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.customization !== undefined ? { customization: body.customization } : {}),
          ...(body.shipping !== undefined ? { shipping: body.shipping } : {}),
          ...(body.assembly !== undefined ? { assembly: body.assembly } : {}),
          ...(body.specifications !== undefined ? { specifications: body.specifications } : {}),
          ...(body.mrp !== undefined ? { mrp: body.mrp } : {}),
          ...(body.taxRate !== undefined ? { taxRate: body.taxRate } : {}),
          ...(body.taxIncluded !== undefined ? { taxIncluded: body.taxIncluded } : {}),
          ...(body.primaryMaterial !== undefined ? { primaryMaterial: body.primaryMaterial } : {}),
          ...(body.frameMaterial !== undefined ? { frameMaterial: body.frameMaterial } : {}),
          ...(body.finishes !== undefined ? { finishes: body.finishes } : {}),
          ...(body.colors !== undefined ? { colors: body.colors } : {}),
          ...(body.seo !== undefined ? { seo: body.seo as { title?: string; description?: string; keywords?: string } } : {}),
        };
        const product = await deps.adminCreateProduct.execute(input as any);
        sendSuccess(req, res, 201, product);
      } catch (error) {
        next(error);
      }
    },

    /** PATCH /admin/products/:id */
    async adminUpdateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = updateProductSchema.parse(req.body);
        // Partial — only include defined keys.
        const input: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(body)) {
          if (v !== undefined) input[k] = v;
        }
        const product = await deps.adminUpdateProduct.execute(req.params['id'] as string, input);
        sendSuccess(req, res, 200, product);
      } catch (error) {
        next(error);
      }
    },

    /** DELETE /admin/products/:id */
    async adminArchiveProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await deps.adminArchiveProduct.execute(req.params['id'] as string);
        sendSuccess(req, res, 204, null);
      } catch (error) {
        next(error);
      }
    },

    // ---- Admin: Categories --------------------------------------------------------------------

    /** POST /admin/categories */
    async adminCreateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = createCategorySchema.parse(req.body);
        const input = {
          name: body.name,
          slug: body.slug,
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
          ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.seo !== undefined ? { seo: body.seo as { title?: string; description?: string; keywords?: string } } : {}),
        };
        const category = await deps.adminCreateCategory.execute(input);
        sendSuccess(req, res, 201, category);
      } catch (error) {
        next(error);
      }
    },

    /** PATCH /admin/categories/:id */
    async adminUpdateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = updateCategorySchema.parse(req.body);
        const input: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(body)) {
          if (v !== undefined) input[k] = v;
        }
        const category = await deps.adminUpdateCategory.execute(req.params['id'] as string, input);
        sendSuccess(req, res, 200, category);
      } catch (error) {
        next(error);
      }
    },

    /** GET /admin/categories/:id */
    async adminGetCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const category = await deps.adminGetCategory.execute(req.params['id'] as string);
        sendSuccess(req, res, 200, category);
      } catch (error) {
        next(error);
      }
    },

    /** DELETE /admin/categories/:id */
    async adminDeleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await deps.adminDeleteCategory.execute(req.params['id'] as string);
        sendSuccess(req, res, 204, null);
      } catch (error) {
        next(error);
      }
    },

    // ---- Admin: Inventory ---------------------------------------------------------------------

    /** POST /admin/inventory/adjust */
    async adminAdjustInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = adjustInventorySchema.parse(req.body);
        const performedBy = (req as Request & { user?: { id: string } }).user?.id;
        const input: AdjustInventoryInput = {
          productId: body.productId,
          variantId: body.variantId,
          warehouseId: body.warehouseId,
          type: body.type,
          quantityDelta: body.quantityDelta,
        };
        if (body.note !== undefined) input.note = body.note;
        if (performedBy !== undefined) input.performedBy = performedBy;
        const inventory = await deps.adminAdjustInventory.execute(input);
        sendSuccess(req, res, 200, inventory);
      } catch (error) {
        next(error);
      }
    },

    // ---- Collections -------------------------------------------------------------------------

    listCollections: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const collections = await deps.listCollections.execute();
        sendSuccess(req, res, 200, collections);
      } catch (error) {
        next(error);
      }
    },

    getCollection: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const collection = await deps.getCollectionDetail.execute(req.params.slug!);
        sendSuccess(req, res, 200, collection);
      } catch (error) {
        next(error);
      }
    },

    adminListCollections: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const collections = await deps.adminListCollections.execute();
        sendSuccess(req, res, 200, collections);
      } catch (error) {
        next(error);
      }
    },

    adminGetCollection: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const collection = await deps.adminGetCollection.execute(req.params.id!);
        sendSuccess(req, res, 200, collection);
      } catch (error) {
        next(error);
      }
    },

    adminCreateCollection: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = createCollectionSchema.parse(req.body);
        const collection = await deps.adminCreateCollection.execute({
          ...body,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        });
        sendSuccess(req, res, 201, collection);
      } catch (error) {
        next(error);
      }
    },

    adminUpdateCollection: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = updateCollectionSchema.parse(req.body);
        const collection = await deps.adminUpdateCollection.execute(req.params.id!, {
          ...body,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
        });
        sendSuccess(req, res, 200, collection);
      } catch (error) {
        next(error);
      }
    },

    adminDeleteCollection: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await deps.adminDeleteCollection.execute(req.params.id!);
        sendSuccess(req, res, 204, null);
      } catch (error) {
        next(error);
      }
    },
  };
}
