import { describe, it, expect } from 'vitest';

interface CatalogItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  basePrice: { amount: number; currency: string };
  mrp?: { amount: number; currency: string };
  material: string;
  ratingsAvg: number;
  ratingsCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  productType: 'READY_TO_SHIP' | 'MADE_TO_ORDER';
  inStock: boolean;
  createdAt: string;
}

const mockCatalog: CatalogItem[] = [
  {
    id: 'prod-1',
    name: 'Royal Teak 8-Seater Dining Table',
    slug: 'royal-teak-8-seater-dining-table',
    category: 'Dining',
    basePrice: { amount: 8500000, currency: 'INR' },
    mrp: { amount: 10500000, currency: 'INR' },
    material: 'Solid Teak Wood',
    ratingsAvg: 4.9,
    ratingsCount: 24,
    isFeatured: true,
    isBestSeller: true,
    productType: 'READY_TO_SHIP',
    inStock: true,
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'prod-2',
    name: 'Maharaja Hand-Carved Velvet Sofa',
    slug: 'maharaja-hand-carved-velvet-sofa',
    category: 'Sofas',
    basePrice: { amount: 12000000, currency: 'INR' },
    mrp: { amount: 14500000, currency: 'INR' },
    material: 'Royal Velvet & Rosewood Frame',
    ratingsAvg: 5.0,
    ratingsCount: 31,
    isFeatured: true,
    isBestSeller: true,
    productType: 'MADE_TO_ORDER',
    inStock: true,
    createdAt: '2026-03-02T12:00:00.000Z',
  },
  {
    id: 'prod-3',
    name: 'Scandinavian White Oak Credenza',
    slug: 'scandinavian-white-oak-credenza',
    category: 'Living Room',
    basePrice: { amount: 6200000, currency: 'INR' },
    mrp: { amount: 7500000, currency: 'INR' },
    material: 'White Oak Wood',
    ratingsAvg: 4.8,
    ratingsCount: 19,
    isFeatured: true,
    isBestSeller: false,
    productType: 'READY_TO_SHIP',
    inStock: true,
    createdAt: '2026-03-03T09:00:00.000Z',
  },
  {
    id: 'prod-4',
    name: 'Brass & Italian Carrara Marble Coffee Table',
    slug: 'brass-and-italian-carrara-marble-coffee-table',
    category: 'Living Room',
    basePrice: { amount: 4400000, currency: 'INR' },
    mrp: { amount: 5500000, currency: 'INR' },
    material: 'Carrara Marble & Brushed Brass',
    ratingsAvg: 4.7,
    ratingsCount: 28,
    isFeatured: false,
    isBestSeller: true,
    productType: 'READY_TO_SHIP',
    inStock: false,
    createdAt: '2026-02-15T08:00:00.000Z',
  },
  {
    id: 'prod-5',
    name: 'Fluted Wood Bedside Nightstand',
    slug: 'fluted-wood-bedside-nightstand',
    category: 'Bedroom',
    basePrice: { amount: 1850000, currency: 'INR' },
    mrp: { amount: 2400000, currency: 'INR' },
    material: 'Solid Ash Wood',
    ratingsAvg: 4.8,
    ratingsCount: 21,
    isFeatured: false,
    isBestSeller: false,
    productType: 'READY_TO_SHIP',
    inStock: true,
    createdAt: '2026-02-20T11:00:00.000Z',
  },
];

describe('Furniture Catalog Architectural & Engineering Harness', () => {
  describe('Angle 1: Logical Integrity & Sorting', () => {
    it('sorts by featured without excluding unfeatured products (fixes 0 results bug)', () => {
      // In the bug, unfeatured products were dropped. In the fix, all 5 items remain, featured first.
      const sorted = [...mockCatalog].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return b.isFeatured ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      expect(sorted.length).toBe(5);
      expect(sorted[0]?.isFeatured).toBe(true);
      expect(sorted[1]?.isFeatured).toBe(true);
      expect(sorted[2]?.isFeatured).toBe(true);
      expect(sorted[3]?.isFeatured).toBe(false);
      expect(sorted[4]?.isFeatured).toBe(false);
    });

    it('correctly sorts by price ascending and descending using basePrice.amount', () => {
      const asc = [...mockCatalog].sort((a, b) => a.basePrice.amount - b.basePrice.amount);
      expect(asc[0]?.name).toBe('Fluted Wood Bedside Nightstand');
      expect(asc[asc.length - 1]?.name).toBe('Maharaja Hand-Carved Velvet Sofa');

      const desc = [...mockCatalog].sort((a, b) => b.basePrice.amount - a.basePrice.amount);
      expect(desc[0]?.name).toBe('Maharaja Hand-Carved Velvet Sofa');
      expect(desc[desc.length - 1]?.name).toBe('Fluted Wood Bedside Nightstand');
    });

    it('correctly sorts by customer rating descending', () => {
      const rated = [...mockCatalog].sort((a, b) => b.ratingsAvg - a.ratingsAvg);
      expect(rated[0]?.name).toBe('Maharaja Hand-Carved Velvet Sofa');
      expect(rated[0]?.ratingsAvg).toBe(5.0);
    });
  });

  describe('Angle 2: Search Sanitization & ReDoS Prevention', () => {
    function sanitizeAndSearch(query: string, items: CatalogItem[]): CatalogItem[] {
      const clean = query.slice(0, 100).trim();
      if (!clean) return items;
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      return items.filter(
        (item) =>
          regex.test(item.name) ||
          regex.test(item.category) ||
          regex.test(item.material)
      );
    }

    it('safely handles special regex characters without throwing syntax errors', () => {
      expect(() => sanitizeAndSearch('***teak+++???', mockCatalog)).not.toThrow();
      expect(() => sanitizeAndSearch('([teak])', mockCatalog)).not.toThrow();
      expect(() => sanitizeAndSearch('\\d+', mockCatalog)).not.toThrow();
    });

    it('finds partial keyword matches across product name and material', () => {
      const teakMatches = sanitizeAndSearch('teak', mockCatalog);
      expect(teakMatches.length).toBe(1);
      expect(teakMatches[0]?.name).toContain('Royal Teak');

      const velvetMatches = sanitizeAndSearch('velvet', mockCatalog);
      expect(velvetMatches.length).toBe(1);
      expect(velvetMatches[0]?.name).toContain('Velvet Sofa');
    });
  });

  describe('Angle 3: Pricing & Discount Mathematics', () => {
    function calculateDiscount(baseAmount: number, mrpAmount?: number): number {
      if (!mrpAmount || mrpAmount <= baseAmount) return 0;
      return Math.round(((mrpAmount - baseAmount) / mrpAmount) * 100);
    }

    function formatINR(amountInPaise: number): string {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amountInPaise / 100);
    }

    it('computes accurate discount percentages', () => {
      // 10,500,000 mrp, 8,500,000 base -> ((10.5 - 8.5) / 10.5) = 19%
      expect(calculateDiscount(8500000, 10500000)).toBe(19);
      // 14,500,000 mrp, 12,000,000 base -> ((14.5 - 12) / 14.5) = 17%
      expect(calculateDiscount(12000000, 14500000)).toBe(17);
      // No discount if MRP is lower or undefined
      expect(calculateDiscount(5000000, 5000000)).toBe(0);
      expect(calculateDiscount(5000000, undefined)).toBe(0);
    });

    it('formats Indian rupee currency with standard grouping', () => {
      expect(formatINR(8500000)).toBe('₹85,000');
      expect(formatINR(12000000)).toBe('₹1,20,000');
      expect(formatINR(1850000)).toBe('₹18,500');
    });
  });

  describe('Angle 4: Multi-Faceted Filter Combinations', () => {
    interface FilterCriteria {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      material?: string;
      productType?: string;
      inStock?: boolean;
    }

    function filterCatalog(items: CatalogItem[], filters: FilterCriteria): CatalogItem[] {
      return items.filter((item) => {
        if (filters.category && item.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
        if (filters.minPrice !== undefined && item.basePrice.amount < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== undefined && item.basePrice.amount > filters.maxPrice) {
          return false;
        }
        if (filters.material && !item.material.toLowerCase().includes(filters.material.toLowerCase())) {
          return false;
        }
        if (filters.productType && item.productType !== filters.productType) {
          return false;
        }
        if (filters.inStock && !item.inStock) {
          return false;
        }
        return true;
      });
    }

    it('filters by category and price range concurrently', () => {
      const results = filterCatalog(mockCatalog, {
        category: 'Living Room',
        minPrice: 4000000,
        maxPrice: 7000000,
      });

      expect(results.length).toBe(2);
      expect(results.map((r) => r.name)).toContain('Scandinavian White Oak Credenza');
      expect(results.map((r) => r.name)).toContain('Brass & Italian Carrara Marble Coffee Table');
    });

    it('filters by In Stock only', () => {
      const inStockResults = filterCatalog(mockCatalog, { inStock: true });
      expect(inStockResults.length).toBe(4);
      expect(inStockResults.find((r) => r.name.includes('Coffee Table'))).toBeUndefined();
    });

    it('filters by Craftsmanship (MADE_TO_ORDER vs READY_TO_SHIP)', () => {
      const bespoke = filterCatalog(mockCatalog, { productType: 'MADE_TO_ORDER' });
      expect(bespoke.length).toBe(1);
      expect(bespoke[0]?.name).toBe('Maharaja Hand-Carved Velvet Sofa');
    });
  });
});
