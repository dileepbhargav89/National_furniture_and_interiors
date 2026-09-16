// Cart controller — docs/08 §8: Bearer or guest-session (sessionId); always self-scoped.
import type { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import type {
  AddItemToCart,
  GetCart,
  MergeGuestCart,
  RemoveItemFromCart,
  UpdateItemQuantity,
  ApplyCouponToCart,
  RemoveCouponFromCart,
  GetActiveCoupons,
} from '../application/cart.use-cases';
import {
  addItemSchema,
  mergeCartSchema,
  updateItemSchema,
  applyCouponSchema,
} from './cart.validators';

export interface CartControllerDeps {
  getCart: GetCart;
  addItemToCart: AddItemToCart;
  removeItemFromCart: RemoveItemFromCart;
  updateItemQuantity: UpdateItemQuantity;
  mergeGuestCart: MergeGuestCart;
  applyCouponToCart: ApplyCouponToCart;
  removeCouponFromCart: RemoveCouponFromCart;
  getActiveCoupons: GetActiveCoupons;
}

type AuthRequest = Request & { user?: { id: string } };

function getIdentity(req: AuthRequest): { userId: string } | { sessionId: string } {
  const userId = req.user?.id;
  if (userId) return { userId };
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (sessionId) return { sessionId };
  // Fallback: use a session cookie or create a temporary ID.
  const cookieSessionId = req.cookies?.['cart_session'] as string | undefined;
  return { sessionId: cookieSessionId ?? '' };
}

export function createCartController(deps: CartControllerDeps) {
  return {
    /** GET /cart — get current cart (auth or guest) */
    async getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const identity = getIdentity(req);
        const cart = await deps.getCart.execute(identity);
        sendSuccess(req, res, 200, cart ?? { items: [], subtotal: 0, discount: 0, total: 0 });
      } catch (error) {
        next(error);
      }
    },

    /** POST /cart/items — add an item to the cart */
    async addItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = addItemSchema.parse(req.body);
        const identity = getIdentity(req);
        const cart = await deps.addItemToCart.execute(identity, body);
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** DELETE /cart/items/:variantId — remove an item */
    async removeItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const identity = getIdentity(req);
        const cart = await deps.removeItemFromCart.execute(
          identity,
          req.params['variantId'] as string,
        );
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** PATCH /cart/items/:variantId — update item quantity */
    async updateItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = updateItemSchema.parse(req.body);
        const identity = getIdentity(req);
        const cart = await deps.updateItemQuantity.execute(
          identity,
          req.params['variantId'] as string,
          body.quantity,
        );
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** POST /cart/merge — merge guest cart into authenticated user's cart on login */
    async mergeCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = mergeCartSchema.parse(req.body);
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ status: 'error', error: { code: 'UNAUTHENTICATED' } });
          return;
        }
        const cart = await deps.mergeGuestCart.execute(body.sessionId, userId);
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** POST /cart/coupon — apply a privilege coupon to the cart */
    async applyCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = applyCouponSchema.parse(req.body);
        const identity = getIdentity(req);
        const cart = await deps.applyCouponToCart.execute(identity, body.code);
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** DELETE /cart/coupon — remove active coupon from cart */
    async removeCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const identity = getIdentity(req);
        const cart = await deps.removeCouponFromCart.execute(identity);
        sendSuccess(req, res, 200, cart);
      } catch (error) {
        next(error);
      }
    },

    /** GET /cart/coupons/active — list available privilege offers */
    async getActiveCoupons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
      try {
        const coupons = await deps.getActiveCoupons.execute();
        sendSuccess(req, res, 200, coupons);
      } catch (error) {
        next(error);
      }
    },
  };
}
