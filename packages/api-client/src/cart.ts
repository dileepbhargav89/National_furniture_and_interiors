import { apiClient } from './client';

export type CartStatus = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  addedAt: string | Date;
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: CartItem[];
  couponCode: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: CartStatus;
  expiresAt: string | Date;
}

export interface AddItemRequest {
  productId: string;
  variantId: string;
  quantity: number;
  name?: string;
  sku?: string;
  image?: string;
  unitPrice?: number;
}

function sessionHeaders(sessionId?: string): Record<string, string> | undefined {
  return sessionId ? { 'x-session-id': sessionId } : undefined;
}

export const CartService = {
  getCart: async (sessionId?: string) => {
    const headers = sessionHeaders(sessionId);
    return apiClient.get<Cart>('/api/v1/cart', headers ? { headers } : undefined);
  },

  addItem: async (item: AddItemRequest, sessionId?: string) => {
    const headers = sessionHeaders(sessionId);
    const apiPayload = {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    };
    return apiClient.post<Cart>('/api/v1/cart/items', apiPayload, headers ? { headers } : undefined);
  },

  updateItem: async (variantId: string, quantity: number, sessionId?: string) => {
    const headers = sessionHeaders(sessionId);
    return apiClient.patch<Cart>(`/api/v1/cart/items/${variantId}`, { quantity }, headers ? { headers } : undefined);
  },

  removeItem: async (variantId: string, sessionId?: string) => {
    const headers = sessionHeaders(sessionId);
    return apiClient.delete<Cart>(`/api/v1/cart/items/${variantId}`, headers ? { headers } : undefined);
  },

  mergeCart: async (sessionId: string) => {
    return apiClient.post<Cart>('/api/v1/cart/merge', { sessionId });
  }
};
