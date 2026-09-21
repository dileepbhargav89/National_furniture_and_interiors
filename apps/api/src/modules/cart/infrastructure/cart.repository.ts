import mongoose, { Schema } from 'mongoose';
import { cacheService, ICacheService, CACHE_KEYS, CACHE_TTL } from '../../../core/cache';
import type { Cart, CartItem } from '../domain/cart.types';
import { CART_STATUSES, calculateCartTotals } from '../domain/cart.types';
import type { ICartRepository } from '../application/ports';

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    // docs/03 §9.3.1 — display snapshot price (paise). Never trusted as final amount.
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'users', default: null },
    sessionId: { type: String, default: null },
    items: { type: [cartItemSchema], default: [] },
    couponCode: { type: String, default: null },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: CART_STATUSES, default: 'ACTIVE' },
    // docs/03 §9.3.1 — TTL index: abandoned guest carts auto-expire (30 days).
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true, collection: 'carts' },
);

// TTL index managed by database migration, not here.
cartSchema.set('autoIndex', false);

const CartModel = (mongoose.models.Cart ?? mongoose.model('Cart', cartSchema)) as mongoose.Model<
  Record<string, unknown>
>;

function toCart(doc: Record<string, unknown>): Cart {
  return {
    id: String(doc._id),
    userId: doc.userId ? String(doc.userId) : null,
    sessionId: doc.sessionId as string | null,
    items: ((doc.items as Record<string, unknown>[]) ?? []).map((i) => ({
      productId: String(i['productId']),
      variantId: String(i['variantId']),
      sku: i['sku'] as string,
      name: i['name'] as string,
      image: i['image'] as string,
      unitPrice: i['unitPrice'] as number,
      quantity: i['quantity'] as number,
      addedAt: i['addedAt'] as Date,
    })),
    couponCode: doc.couponCode as string | null,
    subtotal: doc.subtotal as number,
    discount: doc.discount as number,
    total: doc.total as number,
    status: doc.status as Cart['status'],
    expiresAt: doc.expiresAt as Date,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

function reviveCart(c: Cart): Cart {
  return {
    ...c,
    expiresAt: new Date(c.expiresAt),
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    items: c.items.map((i) => ({
      ...i,
      addedAt: new Date(i.addedAt),
    })),
  };
}

export class MongoCartRepository implements ICartRepository {
  constructor(private readonly cache: ICacheService = cacheService) {}

  async findByUser(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'ACTIVE',
    }).lean<Record<string, unknown> | null>();
    return doc ? toCart(doc) : null;
  }

  async findBySession(sessionId: string): Promise<Cart | null> {
    const key = CACHE_KEYS.cart.session(sessionId);
    const cached = await this.cache.get<Cart>(key);
    if (cached) return reviveCart(cached);

    const doc = await CartModel.findOne({ sessionId, status: 'ACTIVE' }).lean<Record<
      string,
      unknown
    > | null>();
    if (!doc) return null;
    const cart = toCart(doc);
    await this.cache.set(key, cart, CACHE_TTL.CART_SESSION);
    return cart;
  }

  async create(input: { userId: string | null; sessionId: string | null }): Promise<Cart> {
    const doc = await CartModel.create({
      userId: input.userId ? new mongoose.Types.ObjectId(input.userId) : null,
      sessionId: input.sessionId,
    });
    const cart = toCart(doc.toObject() as Record<string, unknown>);
    if (cart.sessionId) {
      await this.cache.set(CACHE_KEYS.cart.session(cart.sessionId), cart, CACHE_TTL.CART_SESSION);
    }
    return cart;
  }

  async updateItems(cartId: string, items: CartItem[], discount = 0): Promise<Cart> {
    const totals = calculateCartTotals(items, discount);
    const doc = await CartModel.findByIdAndUpdate(
      cartId,
      {
        $set: {
          items: items.map((i) => ({
            productId: new mongoose.Types.ObjectId(i.productId),
            variantId: new mongoose.Types.ObjectId(i.variantId),
            sku: i.sku,
            name: i.name,
            image: i.image,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            addedAt: i.addedAt,
          })),
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
        },
      },
      { new: true },
    ).lean<Record<string, unknown> | null>();

    if (!doc) throw new Error('Cart not found during update');
    const cart = toCart(doc);
    if (cart.sessionId) {
      await this.cache.set(CACHE_KEYS.cart.session(cart.sessionId), cart, CACHE_TTL.CART_SESSION);
    }
    return cart;
  }

  async updateCoupon(cartId: string, couponCode: string | null, discount: number): Promise<Cart> {
    const existing = await CartModel.findById(cartId).lean<Record<string, unknown> | null>();
    if (!existing) throw new Error('Cart not found');
    const subtotal = Number(existing.subtotal || 0);
    const validDiscount = Math.min(discount, subtotal);
    const total = Math.max(0, subtotal - validDiscount);

    const doc = await CartModel.findByIdAndUpdate(
      cartId,
      {
        $set: {
          couponCode,
          discount: validDiscount,
          total,
        },
      },
      { new: true },
    ).lean<Record<string, unknown> | null>();

    if (!doc) throw new Error('Cart not found during coupon update');
    const cart = toCart(doc);
    if (cart.sessionId) {
      await this.cache.set(CACHE_KEYS.cart.session(cart.sessionId), cart, CACHE_TTL.CART_SESSION);
    }
    return cart;
  }

  async markConverted(cartId: string): Promise<void> {
    const doc = await CartModel.findByIdAndUpdate(
      cartId,
      { $set: { status: 'CONVERTED' } },
      { new: true },
    ).lean<Record<string, unknown> | null>();
    if (doc && doc.sessionId) {
      await this.cache.del(CACHE_KEYS.cart.session(doc.sessionId as string));
    }
  }

  async mergeAndDelete(guestCartId: string, userCartId: string): Promise<Cart> {
    const [guestDoc, userDoc] = await Promise.all([
      CartModel.findById(guestCartId).lean<Record<string, unknown> | null>(),
      CartModel.findById(userCartId).lean<Record<string, unknown> | null>(),
    ]);

    if (!guestDoc || !userDoc) throw new Error('Cart not found during merge');

    const guestCart = toCart(guestDoc);
    const userCart = toCart(userDoc);

    // Merge: guest items take precedence for same variantId (fresher snapshot).
    const mergedItems = [...userCart.items] as CartItem[];
    for (const guestItem of guestCart.items) {
      const idx = mergedItems.findIndex((i) => i.variantId === guestItem.variantId);
      if (idx >= 0) {
        mergedItems[idx] = {
          ...mergedItems[idx]!,
          quantity: mergedItems[idx]!.quantity + guestItem.quantity,
        };
      } else {
        mergedItems.push(guestItem);
      }
    }

    const totals = calculateCartTotals(mergedItems);
    const updated = await this.updateItems(userCartId, mergedItems, totals.discount);

    // Delete guest cart after merge.
    await CartModel.findByIdAndDelete(guestCartId);
    if (guestCart.sessionId) {
      await this.cache.del(CACHE_KEYS.cart.session(guestCart.sessionId));
    }

    return updated;
  }
}
