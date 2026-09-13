// Unit tests for Cart use-cases — covers price snapshotting, merging, and item limits.
import { describe, it, expect, vi } from 'vitest';
import {
  AddItemToCart,
  GetCart,
  MergeGuestCart,
  RemoveItemFromCart,
  UpdateItemQuantity,
} from '../../../src/modules/cart/application/cart.use-cases';
import type { ICartRepository, IProductSnapshotProvider } from '../../../src/modules/cart/application/ports';
import type { Cart, CartItem } from '../../../src/modules/cart/domain/cart.types';
import { calculateCartTotals, canAddItem } from '../../../src/modules/cart/domain/cart.types';

// ---- Fixtures -------------------------------------------------------------------------------

function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    id: 'cart-001',
    userId: 'user-001',
    sessionId: null,
    items: [],
    couponCode: null,
    subtotal: 0,
    discount: 0,
    total: 0,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'prod-001',
    variantId: 'var-001',
    sku: 'SKU-001',
    name: 'Walnut Sofa',
    image: 'https://cdn.test/img.jpg',
    unitPrice: 5000000, // 50,000 INR in paise
    quantity: 1,
    addedAt: new Date(),
    ...overrides,
  };
}

function makeCartRepo(overrides: Partial<ICartRepository> = {}): ICartRepository {
  return {
    findByUser: vi.fn().mockResolvedValue(null),
    findBySession: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(makeCart()),
    updateItems: vi.fn().mockImplementation(async (_id, items) => makeCart({ items })),
    markConverted: vi.fn().mockResolvedValue(undefined),
    mergeAndDelete: vi.fn().mockResolvedValue(makeCart()),
    ...overrides,
  };
}

function makeSnapshotProvider(available = true): IProductSnapshotProvider {
  return {
    getSnapshot: vi.fn().mockResolvedValue(
      available
        ? { sku: 'SKU-001', name: 'Walnut Sofa', image: 'https://cdn.test/img.jpg', unitPrice: 5000000, isAvailable: true }
        : null,
    ),
  };
}

// ---- Domain: calculateCartTotals ------------------------------------------------------------

describe('calculateCartTotals', () => {
  it('computes correct subtotal with multiple items', () => {
    const items: CartItem[] = [
      makeItem({ unitPrice: 1000000, quantity: 2 }), // 2 × 10,000 = 20,000 INR
      makeItem({ variantId: 'var-002', unitPrice: 500000, quantity: 1 }), // 5,000 INR
    ];
    const totals = calculateCartTotals(items);
    expect(totals.subtotal).toBe(2500000); // 25,000 INR in paise
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(2500000);
  });

  it('applies discount correctly', () => {
    const items: CartItem[] = [makeItem({ unitPrice: 1000000, quantity: 1 })];
    const totals = calculateCartTotals(items, 100000); // 1,000 INR discount
    expect(totals.total).toBe(900000);
  });

  it('total cannot be negative', () => {
    const items: CartItem[] = [makeItem({ unitPrice: 100, quantity: 1 })];
    const totals = calculateCartTotals(items, 999999);
    expect(totals.total).toBe(0);
  });

  it('returns zero totals for empty cart', () => {
    const totals = calculateCartTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
  });
});

// ---- Domain: canAddItem ---------------------------------------------------------------------

describe('canAddItem', () => {
  it('allows adding when cart has fewer than 50 items', () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem({ variantId: `var-00${i}`, quantity: 1 }),
    );
    const cart = makeCart({ items });
    expect(canAddItem(cart, 5)).toBe(true);
  });

  it('rejects when total quantity would exceed 50', () => {
    const items = [makeItem({ quantity: 48 })];
    const cart = makeCart({ items });
    expect(canAddItem(cart, 3)).toBe(false);
  });
});

// ---- GetCart --------------------------------------------------------------------------------

describe('GetCart', () => {
  it('returns existing cart for authenticated user', async () => {
    const existingCart = makeCart();
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(existingCart) });
    const uc = new GetCart(carts);

    const result = await uc.execute({ userId: 'user-001' });
    expect(result?.id).toBe('cart-001');
  });

  it('returns null when no cart exists', async () => {
    const carts = makeCartRepo();
    const uc = new GetCart(carts);

    const result = await uc.execute({ userId: 'user-001' });
    expect(result).toBeNull();
  });

  it('finds cart by sessionId for guest', async () => {
    const guestCart = makeCart({ userId: null, sessionId: 'sess-abc' });
    const carts = makeCartRepo({ findBySession: vi.fn().mockResolvedValue(guestCart) });
    const uc = new GetCart(carts);

    const result = await uc.execute({ sessionId: 'sess-abc' });
    expect(result?.sessionId).toBe('sess-abc');
  });
});

// ---- AddItemToCart --------------------------------------------------------------------------

describe('AddItemToCart', () => {
  it('creates cart if none exists and adds item', async () => {
    const carts = makeCartRepo();
    const products = makeSnapshotProvider(true);
    const uc = new AddItemToCart(carts, products);

    await uc.execute({ userId: 'user-001' }, {
      productId: 'prod-001',
      variantId: 'var-001',
      quantity: 1,
    });

    expect(carts.create).toHaveBeenCalledOnce();
    expect(carts.updateItems).toHaveBeenCalledOnce();
  });

  it('adds item to existing cart found by sessionId', async () => {
    const existingCart = makeCart({ sessionId: 'sess-abc', userId: null });
    const carts = makeCartRepo({ findBySession: vi.fn().mockResolvedValue(existingCart) });
    const products = makeSnapshotProvider(true);
    const uc = new AddItemToCart(carts, products);

    await uc.execute({ sessionId: 'sess-abc' }, {
      productId: 'prod-001',
      variantId: 'var-001',
      quantity: 1,
    });

    expect(carts.create).not.toHaveBeenCalled();
    expect(carts.updateItems).toHaveBeenCalledOnce();
  });

  it('throws NotFoundError when product is unavailable', async () => {
    const carts = makeCartRepo();
    const products = makeSnapshotProvider(false);
    const uc = new AddItemToCart(carts, products);

    await expect(
      uc.execute({ userId: 'user-001' }, {
        productId: 'prod-999',
        variantId: 'var-999',
        quantity: 1,
        sku: 'SKU-999',
        name: 'Ghost Product',
        image: '',
        unitPrice: 0,
      }),
    ).rejects.toThrow('not available');
  });

  it('throws ValidationError for invalid quantity', async () => {
    const carts = makeCartRepo();
    const products = makeSnapshotProvider(true);
    const uc = new AddItemToCart(carts, products);

    await expect(
      uc.execute({ userId: 'user-001' }, {
        productId: 'prod-001',
        variantId: 'var-001',
        quantity: 0,
        sku: 'SKU-001',
        name: 'Sofa',
        image: '',
        unitPrice: 5000000,
      }),
    ).rejects.toThrow('Quantity');
  });

  it('refreshes price snapshot from live catalog (not from client-supplied price)', async () => {
    const liveCatalogPrice = 6000000; // 60,000 INR — different from client input
    const products: IProductSnapshotProvider = {
      getSnapshot: vi.fn().mockResolvedValue({
        sku: 'SKU-001',
        name: 'Walnut Sofa',
        image: 'https://cdn.test/img.jpg',
        unitPrice: liveCatalogPrice,
        isAvailable: true,
      }),
    };
    const carts = makeCartRepo();
    const uc = new AddItemToCart(carts, products);

    await uc.execute({ userId: 'user-001' }, {
      productId: 'prod-001',
      variantId: 'var-001',
      quantity: 1,
      sku: 'SKU-001',
      name: 'Sofa',
      image: '',
      unitPrice: 5000000, // Client sends stale price — should be ignored
    });

    // The items passed to updateItems must use the catalog price, not the client-supplied one.
    const updateCall = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0];
    const savedItems: CartItem[] = updateCall[1];
    expect(savedItems[0]!.unitPrice).toBe(liveCatalogPrice);
  });

  it('increments quantity and refreshes price if item already exists in cart', async () => {
    const existingCart = makeCart({ items: [makeItem({ variantId: 'var-001', quantity: 1, unitPrice: 4000000 })] });
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(existingCart) });
    const liveCatalogPrice = 6000000;
    const products = makeSnapshotProvider(true);
    (products.getSnapshot as ReturnType<typeof vi.fn>).mockResolvedValue({
      sku: 'SKU-001', name: 'Walnut Sofa', image: '', unitPrice: liveCatalogPrice, isAvailable: true,
    });
    const uc = new AddItemToCart(carts, products);

    await uc.execute({ userId: 'user-001' }, {
      productId: 'prod-001',
      variantId: 'var-001',
      quantity: 2,
    });

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems[0]!.quantity).toBe(3); // 1 + 2
    expect(savedItems[0]!.unitPrice).toBe(liveCatalogPrice); // refreshed
  });

  it('throws ValidationError if cart exceeds 50 items', async () => {
    const items = [makeItem({ quantity: 48 })];
    const existingCart = makeCart({ items });
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(existingCart) });
    const products = makeSnapshotProvider(true);
    const uc = new AddItemToCart(carts, products);

    await expect(
      uc.execute({ userId: 'user-001' }, {
        productId: 'prod-001',
        variantId: 'var-002', // new variant
        quantity: 3, // 48 + 3 = 51 > 50
      }),
    ).rejects.toThrow('Cart item limit reached');
  });
});

// ---- RemoveItemFromCart ---------------------------------------------------------------------

describe('RemoveItemFromCart', () => {
  it('removes item by variantId', async () => {
    const items = [makeItem({ variantId: 'var-001' }), makeItem({ variantId: 'var-002' })];
    const cart = makeCart({ items });
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(cart) });
    const uc = new RemoveItemFromCart(carts);

    await uc.execute({ userId: 'user-001' }, 'var-001');

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0]!.variantId).toBe('var-002');
  });

  it('removes item by variantId using sessionId', async () => {
    const items = [makeItem({ variantId: 'var-001' }), makeItem({ variantId: 'var-002' })];
    const cart = makeCart({ items, userId: null, sessionId: 'sess-abc' });
    const carts = makeCartRepo({ findBySession: vi.fn().mockResolvedValue(cart) });
    const uc = new RemoveItemFromCart(carts);

    await uc.execute({ sessionId: 'sess-abc' }, 'var-001');

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0]!.variantId).toBe('var-002');
  });

  it('throws NotFoundError when cart does not exist', async () => {
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(null) });
    const uc = new RemoveItemFromCart(carts);

    await expect(uc.execute({ userId: 'user-001' }, 'var-001')).rejects.toThrow('Cart not found');
  });
});

// ---- MergeGuestCart -------------------------------------------------------------------------

describe('MergeGuestCart', () => {
  it('calls mergeAndDelete when both carts exist', async () => {
    const guestCart = makeCart({ id: 'guest-cart', userId: null, sessionId: 'sess-abc', items: [makeItem()] });
    const userCart = makeCart({ id: 'user-cart', userId: 'user-001' });

    const carts = makeCartRepo({
      findBySession: vi.fn().mockResolvedValue(guestCart),
      findByUser: vi.fn().mockResolvedValue(userCart),
    });
    const uc = new MergeGuestCart(carts);

    await uc.execute('sess-abc', 'user-001');

    expect(carts.mergeAndDelete).toHaveBeenCalledWith('guest-cart', 'user-cart');
  });

  it('creates user cart from guest items when user has no cart', async () => {
    const guestCart = makeCart({ id: 'guest-cart', userId: null, sessionId: 'sess-abc', items: [makeItem()] });

    const carts = makeCartRepo({
      findBySession: vi.fn().mockResolvedValue(guestCart),
      findByUser: vi.fn().mockResolvedValue(null),
    });
    const uc = new MergeGuestCart(carts);

    await uc.execute('sess-abc', 'user-001');

    expect(carts.create).toHaveBeenCalledWith({ userId: 'user-001', sessionId: null });
    expect(carts.updateItems).toHaveBeenCalledOnce();
  });

  it('returns existing user cart when guest cart is empty', async () => {
    const emptyGuestCart = makeCart({ id: 'guest-cart', items: [] });
    const userCart = makeCart({ id: 'user-cart' });

    const carts = makeCartRepo({
      findBySession: vi.fn().mockResolvedValue(emptyGuestCart),
      findByUser: vi.fn().mockResolvedValue(userCart),
    });
    const uc = new MergeGuestCart(carts);

    const result = await uc.execute('sess-abc', 'user-001');
    expect(result.id).toBe('user-cart');
    expect(carts.mergeAndDelete).not.toHaveBeenCalled();
  });
});

// ---- UpdateItemQuantity ---------------------------------------------------------------------

describe('UpdateItemQuantity', () => {
  it('updates quantity of an existing item', async () => {
    const items = [makeItem({ variantId: 'var-001', quantity: 1 })];
    const cart = makeCart({ items });
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(cart) });
    const uc = new UpdateItemQuantity(carts);

    await uc.execute({ userId: 'user-001' }, 'var-001', 5);

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems[0]!.quantity).toBe(5);
  });

  it('updates quantity of an existing item using sessionId', async () => {
    const items = [makeItem({ variantId: 'var-001', quantity: 1 })];
    const cart = makeCart({ items, sessionId: 'sess-abc', userId: null });
    const carts = makeCartRepo({ findBySession: vi.fn().mockResolvedValue(cart) });
    const uc = new UpdateItemQuantity(carts);

    await uc.execute({ sessionId: 'sess-abc' }, 'var-001', 3);

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems[0]!.quantity).toBe(3);
  });

  it('removes the item entirely if quantity is set to 0', async () => {
    const items = [makeItem({ variantId: 'var-001', quantity: 1 })];
    const cart = makeCart({ items });
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(cart) });
    const uc = new UpdateItemQuantity(carts);

    await uc.execute({ userId: 'user-001' }, 'var-001', 0);

    const savedItems: CartItem[] = (carts.updateItems as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(savedItems).toHaveLength(0);
  });

  it('throws ValidationError for invalid quantity', async () => {
    const carts = makeCartRepo();
    const uc = new UpdateItemQuantity(carts);

    await expect(uc.execute({ userId: 'user-001' }, 'var-001', -1)).rejects.toThrow('Quantity');
    await expect(uc.execute({ userId: 'user-001' }, 'var-001', 101)).rejects.toThrow('Quantity');
  });

  it('throws NotFoundError when cart does not exist', async () => {
    const carts = makeCartRepo({ findByUser: vi.fn().mockResolvedValue(null) });
    const uc = new UpdateItemQuantity(carts);

    await expect(uc.execute({ userId: 'user-001' }, 'var-001', 2)).rejects.toThrow('Cart not found');
  });
});

