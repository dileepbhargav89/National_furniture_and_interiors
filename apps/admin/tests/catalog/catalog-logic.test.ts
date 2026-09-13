import { describe, it, expect } from 'vitest';
import { Category, Product } from '@nfi/api-client';

describe('Catalog Module Logic Harness', () => {
  describe('Category Hierarchy Algorithm', () => {
    type CategoryTestItem = Partial<Category> & {
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      sortOrder?: number;
      level?: number;
      isActive?: boolean;
    };

    interface FlattenedCategory extends CategoryTestItem {
      depth?: number;
    }

    function buildCategoryTree(categories: CategoryTestItem[], searchQuery = ''): FlattenedCategory[] {
      const filtered = categories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (searchQuery) return filtered.map((c) => ({ ...c, depth: 0 }));

      const roots = filtered.filter((c) => !c.parentId);
      const result: FlattenedCategory[] = [];

      const appendWithChildren = (parent: CategoryTestItem, depth: number) => {
        result.push({ ...parent, depth });
        const children = filtered.filter(
          (c) => c.parentId === (parent.id || parent._id)
        );
        children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        children.forEach((child) => appendWithChildren(child, depth + 1));
      };

      roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      roots.forEach((root) => appendWithChildren(root, 0));

      const processedIds = new Set(result.map((r) => r.id || r._id));
      filtered.forEach((c) => {
        if (!processedIds.has(c.id || c._id)) {
          result.push({ ...c, depth: 0 });
        }
      });

      return result;
    }

    it('should correctly nest children under parents with appropriate depths', () => {
      const mockCategories: CategoryTestItem[] = [
        { id: 'cat-sofas', name: 'Sofas & Couches', slug: 'sofas', parentId: 'cat-living', sortOrder: 1, level: 1, isActive: true },
        { id: 'cat-living', name: 'Living Room', slug: 'living-room', parentId: null, sortOrder: 0, level: 0, isActive: true },
        { id: 'cat-sectional', name: 'Sectionals', slug: 'sectionals', parentId: 'cat-sofas', sortOrder: 0, level: 2, isActive: true },
        { id: 'cat-dining', name: 'Dining Room', slug: 'dining-room', parentId: null, sortOrder: 1, level: 0, isActive: true },
      ];

      const tree = buildCategoryTree(mockCategories);

      expect(tree).toHaveLength(4);
      expect(tree[0]?.id).toBe('cat-living');
      expect(tree[0]?.depth).toBe(0);

      expect(tree[1]?.id).toBe('cat-sofas');
      expect(tree[1]?.depth).toBe(1);

      expect(tree[2]?.id).toBe('cat-sectional');
      expect(tree[2]?.depth).toBe(2);

      expect(tree[3]?.id).toBe('cat-dining');
      expect(tree[3]?.depth).toBe(0);
    });

    it('should flatten results with depth 0 when search query is active', () => {
      const mockCategories: CategoryTestItem[] = [
        { id: 'cat-1', name: 'Living Room', slug: 'living', parentId: null, level: 0, isActive: true },
        { id: 'cat-2', name: 'Leather Sofas', slug: 'leather-sofas', parentId: 'cat-1', level: 1, isActive: true },
      ];

      const tree = buildCategoryTree(mockCategories, 'Leather');
      expect(tree).toHaveLength(1);
      expect(tree[0]?.id).toBe('cat-2');
      expect(tree[0]?.depth).toBe(0);
    });

    it('should gracefully handle orphaned categories whose parent does not exist', () => {
      const mockCategories: CategoryTestItem[] = [
        { id: 'cat-orphan', name: 'Orphan Node', slug: 'orphan', parentId: 'cat-missing', level: 1, isActive: true },
      ];

      const tree = buildCategoryTree(mockCategories);
      expect(tree).toHaveLength(1);
      expect(tree[0]?.id).toBe('cat-orphan');
      expect(tree[0]?.depth).toBe(0);
    });
  });

  describe('Inventory Classification Thresholds', () => {
    function classifyStock(stock: number): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' {
      if (stock === 0) return 'OUT_OF_STOCK';
      if (stock <= 5) return 'LOW_STOCK';
      return 'IN_STOCK';
    }

    it('should classify 0 units as OUT_OF_STOCK', () => {
      expect(classifyStock(0)).toBe('OUT_OF_STOCK');
    });

    it('should classify 1 to 5 units as LOW_STOCK', () => {
      expect(classifyStock(1)).toBe('LOW_STOCK');
      expect(classifyStock(3)).toBe('LOW_STOCK');
      expect(classifyStock(5)).toBe('LOW_STOCK');
    });

    it('should classify greater than 5 units as IN_STOCK', () => {
      expect(classifyStock(6)).toBe('IN_STOCK');
      expect(classifyStock(50)).toBe('IN_STOCK');
    });
  });

  describe('Product Sorting and Multi-Filtering', () => {
    const products: Partial<Product>[] = [
      { id: '1', name: 'Teak Wood Dining Table', sku: 'TBL-TK-001', basePrice: { amount: 4500000, currency: 'INR' }, status: 'PUBLISHED', productType: 'READY_TO_SHIP' },
      { id: '2', name: 'Velvet Armchair', sku: 'CHR-VL-002', basePrice: { amount: 1800000, currency: 'INR' }, status: 'DRAFT', productType: 'MADE_TO_ORDER' },
      { id: '3', name: 'Solid Oak Credenza', sku: 'CRD-OK-003', basePrice: { amount: 6200000, currency: 'INR' }, status: 'PUBLISHED', productType: 'MADE_TO_ORDER' },
    ];

    it('should filter products by productType', () => {
      const filtered = products.filter((p) => p.productType === 'READY_TO_SHIP');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe('1');
    });

    it('should sort products by price ascending and descending', () => {
      const asc = [...products].sort((a, b) => (a.basePrice?.amount ?? 0) - (b.basePrice?.amount ?? 0));
      expect(asc[0]?.id).toBe('2'); // 1800000
      expect(asc[2]?.id).toBe('3'); // 6200000

      const desc = [...products].sort((a, b) => (b.basePrice?.amount ?? 0) - (a.basePrice?.amount ?? 0));
      expect(desc[0]?.id).toBe('3');
      expect(desc[2]?.id).toBe('2');
    });
  });
});
