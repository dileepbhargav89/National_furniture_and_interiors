import { describe, expect, it, vi } from 'vitest';
import { CatalogProductSnapshotProvider } from '../../../src/modules/cart/infrastructure/catalog-snapshot.provider';
import type {
  IProductRepository,
  IInventoryRepository,
} from '../../../src/modules/catalog/application/ports';
import type { Product } from '../../../src/modules/catalog/domain/catalog.types';

const baseProduct: Product = {
  id: 'prod-teak-table',
  name: 'Royal Teak Dining Table',
  slug: 'royal-teak-dining-table',
  sku: 'NFI-TBL-001',
  brand: 'National Interiors',
  categoryId: 'cat-dining',
  categoryIds: ['cat-dining'],
  collectionIds: [],
  roomTypes: ['DINING'],
  styles: ['CONTEMPORARY'],
  primaryMaterial: 'BURMA_TEAK',
  materials: ['BURMA_TEAK', 'BRASS'],
  productType: 'MADE_TO_ORDER',
  status: 'PUBLISHED',
  basePrice: { amount: 15000000, currency: 'INR' },
  taxRate: 18,
  hsnCode: '9403',
  isCustomizable: true,
  images: [
    {
      url: 'https://images.nfi.com/teak-table.jpg',
      publicId: 'img1',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
  variants: [
    {
      variantId: 'var-6seater',
      sku: 'NFI-TBL-001-6S',
      attributes: [{ name: 'Seater', value: '6-Seater' }],
      priceOverride: null,
      images: [],
      dimensionsOverride: undefined,
      weightOverride: undefined,
      isActive: true,
    },
  ],
  customization: { enabled: true, options: ['Dark Walnut Finish'] },
  dimensions: { length: 180, width: 90, height: 75, unit: 'cm' },
  weight: 65,
  features: ['Kiln-seasoned teakwood'],
  careInstructions: 'Wipe with damp cloth',
  warranty: '10-year structural warranty',
  tags: ['teak', 'dining'],
  featured: true,
  sortOrder: 1,
  seo: undefined,
  documents: [],
  shipping: { type: 'WHITE_GLOVE', estimateDays: '14-21 days' },
  assembly: { required: true, type: 'PROFESSIONAL', fee: 0, professionalAvailable: true },
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CatalogProductSnapshotProvider', () => {
  it('returns null if product is not found', async () => {
    const mockProducts = {
      findById: vi.fn(async () => null),
    } as unknown as IProductRepository;
    const mockInventory = {
      findByProduct: vi.fn(async () => []),
    } as unknown as IInventoryRepository;

    const provider = new CatalogProductSnapshotProvider(mockProducts, mockInventory);
    const snapshot = await provider.getSnapshot('prod-missing', 'var-missing');

    expect(snapshot).toBeNull();
  });

  it('returns null if product status is not PUBLISHED (e.g. DRAFT)', async () => {
    const mockProducts = {
      findById: vi.fn(async () => ({ ...baseProduct, status: 'DRAFT' as const })),
    } as unknown as IProductRepository;
    const mockInventory = {
      findByProduct: vi.fn(async () => []),
    } as unknown as IInventoryRepository;

    const provider = new CatalogProductSnapshotProvider(mockProducts, mockInventory);
    const snapshot = await provider.getSnapshot(baseProduct.id, 'var-6seater');

    expect(snapshot).toBeNull();
  });

  it('reports isAvailable: true for MADE_TO_ORDER bespoke furniture even with 0 warehouse stock', async () => {
    const mockProducts = {
      findById: vi.fn(async () => ({ ...baseProduct, productType: 'MADE_TO_ORDER' as const })),
    } as unknown as IProductRepository;
    const mockInventory = {
      findByProduct: vi.fn(async () => [
        {
          id: 'inv-1',
          productId: baseProduct.id,
          variantId: 'var-6seater',
          warehouseId: 'wh-blr',
          quantityOnHand: 0,
          quantityReserved: 0,
          quantityAvailable: 0,
          reorderPoint: 0,
          reorderQuantity: 0,
          leadTimeDays: 21,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    } as unknown as IInventoryRepository;

    const provider = new CatalogProductSnapshotProvider(mockProducts, mockInventory);
    const snapshot = await provider.getSnapshot(baseProduct.id, 'var-6seater');

    expect(snapshot).not.toBeNull();
    expect(snapshot?.isAvailable).toBe(true);
    expect(snapshot?.sku).toBe('NFI-TBL-001-6S');
    expect(snapshot?.unitPrice).toBe(15000000);
  });

  it('reports isAvailable: true for CUSTOM furniture even if warehouse records are unseeded', async () => {
    const mockProducts = {
      findById: vi.fn(async () => ({ ...baseProduct, productType: 'CUSTOM' as const })),
    } as unknown as IProductRepository;
    const mockInventory = {
      findByProduct: vi.fn(async () => []),
    } as unknown as IInventoryRepository;

    const provider = new CatalogProductSnapshotProvider(mockProducts, mockInventory);
    const snapshot = await provider.getSnapshot(baseProduct.id, 'var-6seater');

    expect(snapshot).not.toBeNull();
    expect(snapshot?.isAvailable).toBe(true);
  });

  it('correctly respects stock availability for READY_TO_SHIP products', async () => {
    const mockProducts = {
      findById: vi.fn(async () => ({ ...baseProduct, productType: 'READY_TO_SHIP' as const })),
    } as unknown as IProductRepository;

    // In stock case
    const mockInventoryInStock = {
      findByProduct: vi.fn(async () => [
        {
          id: 'inv-1',
          productId: baseProduct.id,
          variantId: 'var-6seater',
          warehouseId: 'wh-blr',
          quantityOnHand: 5,
          quantityReserved: 1,
          quantityAvailable: 4,
          reorderPoint: 2,
          reorderQuantity: 5,
          leadTimeDays: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    } as unknown as IInventoryRepository;

    const providerInStock = new CatalogProductSnapshotProvider(mockProducts, mockInventoryInStock);
    const snapshotInStock = await providerInStock.getSnapshot(baseProduct.id, 'var-6seater');
    expect(snapshotInStock?.isAvailable).toBe(true);

    // Out of stock case
    const mockInventoryOutOfStock = {
      findByProduct: vi.fn(async () => [
        {
          id: 'inv-1',
          productId: baseProduct.id,
          variantId: 'var-6seater',
          warehouseId: 'wh-blr',
          quantityOnHand: 2,
          quantityReserved: 2,
          quantityAvailable: 0,
          reorderPoint: 2,
          reorderQuantity: 5,
          leadTimeDays: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    } as unknown as IInventoryRepository;

    const providerOutOfStock = new CatalogProductSnapshotProvider(
      mockProducts,
      mockInventoryOutOfStock,
    );
    const snapshotOutOfStock = await providerOutOfStock.getSnapshot(baseProduct.id, 'var-6seater');
    expect(snapshotOutOfStock?.isAvailable).toBe(false);
  });
});
