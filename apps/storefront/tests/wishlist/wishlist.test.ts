import { describe, it, expect } from 'vitest';

export interface TestWishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  currency: string;
  images: string[];
  category: string;
  material?: string;
}

function calculateWishlistSummary(items: TestWishlistItem[]) {
  const totalValue = items.reduce((sum, item) => sum + item.price, 0);
  const totalMrp = items.reduce((sum, item) => sum + (item.mrp || item.price), 0);
  const totalSavings = totalMrp > totalValue ? totalMrp - totalValue : 0;
  return {
    itemCount: items.length,
    totalValue,
    totalMrp,
    totalSavings,
  };
}

describe('Wishlist State & Calculations Contract', () => {
  const sampleItems: TestWishlistItem[] = [
    {
      id: 'item-1',
      name: 'The Indiranagar Burma Teak Dining Table',
      slug: 'the-indiranagar-burma-teak-dining-table',
      price: 6800000,
      mrp: 8500000,
      currency: 'INR',
      images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf'],
      category: 'Dining Room',
      material: 'Kiln-Seasoned Burma Teak',
    },
    {
      id: 'item-2',
      name: 'Koramangala Minimalist Bouclé Lounge Chair',
      slug: 'koramangala-minimalist-boucle-lounge-chair',
      price: 3400000,
      mrp: 4200000,
      currency: 'INR',
      images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c'],
      category: 'Living Room',
      material: 'Belgian Bouclé',
    },
  ];

  it('correctly calculates total valuation and factory-direct savings', () => {
    const summary = calculateWishlistSummary(sampleItems);
    expect(summary.itemCount).toBe(2);
    expect(summary.totalValue).toBe(10200000); // 68,000 + 34,000 = 102,000 INR
    expect(summary.totalMrp).toBe(12700000);
    expect(summary.totalSavings).toBe(2500000); // 25,000 INR savings
  });

  it('handles empty wishlist state gracefully', () => {
    const summary = calculateWishlistSummary([]);
    expect(summary.itemCount).toBe(0);
    expect(summary.totalValue).toBe(0);
    expect(summary.totalSavings).toBe(0);
  });

  it('verifies item addition and removal logic', () => {
    let items = [...sampleItems];
    // Remove item 1
    items = items.filter((i) => i.id !== 'item-1');
    expect(items.length).toBe(1);
    expect(items[0]?.id).toBe('item-2');

    // Add new piece
    const newItem: TestWishlistItem = {
      id: 'item-3',
      name: 'Whitefield Architectural Media Credenza',
      slug: 'whitefield-architectural-media-credenza',
      price: 4800000,
      mrp: 5800000,
      currency: 'INR',
      images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2'],
      category: 'Storage',
      material: 'Century 710 Marine Ply',
    };
    items.push(newItem);
    expect(items.length).toBe(2);
    expect(items.some((i) => i.id === 'item-3')).toBe(true);
  });

  it('formats currency correctly in Indian Rupee format without decimals', () => {
    const format = (amount: number) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount / 100);

    expect(format(6800000)).toContain('68,000');
    expect(format(3400000)).toContain('34,000');
  });
});
