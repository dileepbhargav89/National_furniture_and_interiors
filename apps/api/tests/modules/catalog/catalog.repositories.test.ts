import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MongoCategoryRepository,
  MongoProductCollectionRepository,
  MongoProductRepository,
} from '../../../src/modules/catalog/infrastructure/catalog.repositories';
import {
  CategoryModel,
  ProductCollectionModel,
  ProductModel,
} from '../../../src/modules/catalog/infrastructure/catalog.schemas';
import type { ICacheService } from '../../../src/core/cache';

vi.mock('../../../src/modules/catalog/infrastructure/catalog.schemas', () => ({
  CategoryModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
  ProductCollectionModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
  ProductModel: {
    findOne: vi.fn(),
    find: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn(),
  },
  InventoryModel: { findOne: vi.fn(), find: vi.fn() },
  InventoryMovementModel: { create: vi.fn() },
  WarehouseModel: { findOne: vi.fn(), find: vi.fn() },
}));

describe('Catalog Repositories Caching', () => {
  let mockCache: ICacheService & {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
    getOrSet: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
      getOrSet: vi.fn(),
    };
  });

  describe('MongoCategoryRepository', () => {
    it('returns cached category by id without querying db', async () => {
      const repo = new MongoCategoryRepository(mockCache);
      const cached = {
        id: '507f1f77bcf86cd799439011',
        name: 'Chairs',
        slug: 'chairs',
        ancestors: [],
        level: 0,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCache.get.mockResolvedValueOnce(cached);

      const res = await repo.findById('507f1f77bcf86cd799439011');
      expect(res?.name).toBe('Chairs');
      expect(CategoryModel.findOne).not.toHaveBeenCalled();
    });

    it('queries db on cache miss and stores in cache', async () => {
      const repo = new MongoCategoryRepository(mockCache);
      const dbDoc = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Tables',
        slug: 'tables',
        ancestors: [],
        level: 0,
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(CategoryModel.findOne).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce(dbDoc),
      } as unknown as ReturnType<typeof CategoryModel.findOne>);

      const res = await repo.findById('507f1f77bcf86cd799439011');
      expect(res?.name).toBe('Tables');
      expect(mockCache.set).toHaveBeenCalledWith(
        'catalog:v1:category:507f1f77bcf86cd799439011',
        expect.objectContaining({ name: 'Tables' }),
        30 * 60,
      );
    });

    it('invalidates cache on update', async () => {
      const repo = new MongoCategoryRepository(mockCache);
      vi.mocked(CategoryModel.findOneAndUpdate).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce({
          _id: '507f1f77bcf86cd799439011',
          name: 'Updated Tables',
          slug: 'updated-tables',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      } as unknown as ReturnType<typeof CategoryModel.findOneAndUpdate>);

      await repo.update('507f1f77bcf86cd799439011', { name: 'Updated Tables' });
      expect(mockCache.del).toHaveBeenCalledWith(
        'catalog:v1:category:507f1f77bcf86cd799439011',
        'catalog:v1:categories:all',
        'catalog:v1:categories:true',
        'catalog:v1:categories:false',
      );
      expect(mockCache.del).toHaveBeenCalledWith('catalog:v1:category:slug:updated-tables');
    });
  });

  describe('MongoProductCollectionRepository', () => {
    it('returns cached collection without querying db', async () => {
      const repo = new MongoProductCollectionRepository(mockCache);
      const cached = {
        id: '507f1f77bcf86cd799439022',
        title: 'Autumn Collection',
        slug: 'autumn-collection',
        status: 'PUBLISHED',
        featured: true,
        sortOrder: 1,
        galleryImages: [],
        galleryVideos: [],
        productIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCache.get.mockResolvedValueOnce(cached);

      const res = await repo.findBySlug('autumn-collection');
      expect(res?.title).toBe('Autumn Collection');
      expect(ProductCollectionModel.findOne).not.toHaveBeenCalled();
    });

    it('caches collection on cache miss', async () => {
      const repo = new MongoProductCollectionRepository(mockCache);
      const dbDoc = {
        _id: '507f1f77bcf86cd799439022',
        title: 'Spring Collection',
        slug: 'spring-collection',
        status: 'PUBLISHED',
        featured: true,
        sortOrder: 1,
        galleryImages: [],
        galleryVideos: [],
        productIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(ProductCollectionModel.findOne).mockReturnValueOnce({
        lean: vi.fn().mockResolvedValueOnce(dbDoc),
      } as unknown as ReturnType<typeof ProductCollectionModel.findOne>);

      const res = await repo.findBySlug('spring-collection');
      expect(res?.title).toBe('Spring Collection');
      expect(mockCache.set).toHaveBeenCalledWith(
        'catalog:v1:collection:slug:spring-collection',
        expect.objectContaining({ title: 'Spring Collection' }),
        30 * 60,
      );
    });
  });

  describe('MongoProductRepository', () => {
    it('returns cached product list on cache hit', async () => {
      const repo = new MongoProductRepository(mockCache);
      const cachedResult = {
        items: [
          {
            id: '507f1f77bcf86cd799439033',
            name: 'Sofa',
            slug: 'sofa',
            sku: 'SOFA-1',
            categoryId: '507f1f77bcf86cd799439011',
            categoryIds: [],
            description: 'Luxury sofa',
            finishes: [],
            colors: [],
            images: [],
            videos: [],
            documents: [],
            variants: [],
            basePrice: { amount: 100000, currency: 'INR' },
            mrp: { amount: 120000, currency: 'INR' },
            tags: [],
            isFeatured: true,
            isBestSeller: false,
            productType: 'STANDARD',
            status: 'PUBLISHED',
            relatedProductIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        limit: 24,
      };
      mockCache.get.mockResolvedValueOnce(cachedResult);

      const res = await repo.list({}, { page: 1, limit: 24 });
      expect(res.items.length).toBe(1);
      expect(res.items[0]?.name).toBe('Sofa');
      expect(ProductModel.find).not.toHaveBeenCalled();
    });
  });
});
