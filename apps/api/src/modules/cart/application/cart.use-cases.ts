// Cart use-cases — docs/06 §4.3: application/ holds use-cases and port interfaces.
// docs/08 §8 cart row: Bearer or guest-session (sessionId); always self-scoped.
import { NotFoundError, ValidationError } from '../../../core/exceptions';
import { canAddItem, calculateCartTotals } from '../domain/cart.types';
import type { Cart, CartItem } from '../domain/cart.types';
import type { AddItemInput, ICartRepository, IProductSnapshotProvider } from './ports';

type CartIdentity = { userId: string } | { sessionId: string };

// ---- GetCart ---------------------------------------------------------------------------------

export class GetCart {
  constructor(private readonly carts: ICartRepository) {}

  async execute(identity: CartIdentity): Promise<Cart | null> {
    if ('userId' in identity) {
      return this.carts.findByUser(identity.userId);
    }
    return this.carts.findBySession(identity.sessionId);
  }
}

// ---- AddItemToCart ---------------------------------------------------------------------------

export class AddItemToCart {
  constructor(
    private readonly carts: ICartRepository,
    private readonly products: IProductSnapshotProvider,
  ) {}

  async execute(identity: CartIdentity, input: AddItemInput): Promise<Cart> {
    if (input.quantity < 1 || input.quantity > 100) {
      throw new ValidationError('Quantity must be between 1 and 100');
    }

    // Validate the item against live catalog data — docs/08 §8 cart row.
    const snapshot = await this.products.getSnapshot(input.productId, input.variantId);
    if (!snapshot || !snapshot.isAvailable) {
      throw new NotFoundError('Product variant not available');
    }

    let cart = await this.getOrCreate(identity);

    if (!canAddItem(cart, input.quantity)) {
      throw new ValidationError('Cart item limit reached (max 50 items)');
    }

    // Build new items array — if variant already in cart, increment quantity.
    const existingIndex = cart.items.findIndex((i) => i.variantId === input.variantId);
    const updatedItems: CartItem[] = cart.items.map((i) => ({ ...i })) as CartItem[];

    if (existingIndex >= 0) {
      const existing = updatedItems[existingIndex]!;
      updatedItems[existingIndex] = {
        ...existing,
        quantity: existing.quantity + input.quantity,
        // Refresh the display price snapshot from live catalog.
        unitPrice: snapshot.unitPrice,
        addedAt: existing.addedAt,
      };
    } else {
      updatedItems.push({
        productId: input.productId,
        variantId: input.variantId,
        sku: snapshot.sku,
        name: snapshot.name,
        image: snapshot.image,
        unitPrice: snapshot.unitPrice,
        quantity: input.quantity,
        addedAt: new Date(),
      });
    }

    const totals = calculateCartTotals(updatedItems);
    return this.carts.updateItems(cart.id, updatedItems, totals.discount);
  }

  private async getOrCreate(identity: CartIdentity): Promise<Cart> {
    const existing = 'userId' in identity
      ? await this.carts.findByUser(identity.userId)
      : await this.carts.findBySession(identity.sessionId);

    if (existing) return existing;

    return this.carts.create({
      userId: 'userId' in identity ? identity.userId : null,
      sessionId: 'sessionId' in identity ? identity.sessionId : null,
    });
  }
}

// ---- RemoveItemFromCart ----------------------------------------------------------------------

export class RemoveItemFromCart {
  constructor(private readonly carts: ICartRepository) {}

  async execute(identity: CartIdentity, variantId: string): Promise<Cart> {
    const cart = await this.getCart(identity);

    const updatedItems = cart.items.filter((i) => i.variantId !== variantId) as CartItem[];
    const totals = calculateCartTotals(updatedItems);
    return this.carts.updateItems(cart.id, updatedItems, totals.discount);
  }

  private async getCart(identity: CartIdentity): Promise<Cart> {
    const cart = 'userId' in identity
      ? await this.carts.findByUser(identity.userId)
      : await this.carts.findBySession(identity.sessionId);

    if (!cart) throw new NotFoundError('Cart not found');
    return cart;
  }
}

// ---- UpdateItemQuantity ----------------------------------------------------------------------

export class UpdateItemQuantity {
  constructor(private readonly carts: ICartRepository) {}

  async execute(identity: CartIdentity, variantId: string, quantity: number): Promise<Cart> {
    if (quantity < 0 || quantity > 100) {
      throw new ValidationError('Quantity must be between 0 and 100');
    }

    const cart = 'userId' in identity
      ? await this.carts.findByUser(identity.userId)
      : await this.carts.findBySession(identity.sessionId);

    if (!cart) throw new NotFoundError('Cart not found');

    let updatedItems: CartItem[];
    if (quantity === 0) {
      // Remove if quantity is set to 0.
      updatedItems = cart.items.filter((i) => i.variantId !== variantId) as CartItem[];
    } else {
      updatedItems = cart.items.map((i) =>
        i.variantId === variantId ? { ...i, quantity } : i,
      ) as CartItem[];
    }

    const totals = calculateCartTotals(updatedItems);
    return this.carts.updateItems(cart.id, updatedItems, totals.discount);
  }
}

// ---- MergeGuestCart --------------------------------------------------------------------------

/**
 * docs/08 §8 cart row: "merge guest cart into account cart on login".
 * Guest items are merged into the user cart, then the guest cart is deleted.
 */
export class MergeGuestCart {
  constructor(private readonly carts: ICartRepository) {}

  async execute(sessionId: string, userId: string): Promise<Cart> {
    const guestCart = await this.carts.findBySession(sessionId);
    if (!guestCart || guestCart.items.length === 0) {
      // Nothing to merge — return or create the user's cart.
      const userCart = await this.carts.findByUser(userId);
      return userCart ?? this.carts.create({ userId, sessionId: null });
    }

    const userCart = await this.carts.findByUser(userId);
    if (!userCart) {
      // No user cart yet — just re-assign the guest cart.
      const items = guestCart.items as CartItem[];
      const totals = calculateCartTotals(items);
      const created = await this.carts.create({ userId, sessionId: null });
      return this.carts.updateItems(created.id, items, totals.discount);
    }

    return this.carts.mergeAndDelete(guestCart.id, userCart.id);
  }
}
