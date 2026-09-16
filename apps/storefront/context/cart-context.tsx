'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CartService, Cart, CartItem, AddItemRequest } from '@nfi/api-client';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddItemRequest) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  itemCount: number;
}

const KNOWN_COUPONS: Record<
  string,
  {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderValue: number;
    maxDiscountAmount: number | null;
  }
> = {
  SPRING2026: { type: 'PERCENTAGE', value: 10, minOrderValue: 5000000, maxDiscountAmount: 1500000 },
  EXTRA10K: { type: 'FIXED', value: 1000000, minOrderValue: 10000000, maxDiscountAmount: null },
  NFI10: { type: 'PERCENTAGE', value: 10, minOrderValue: 7500000, maxDiscountAmount: 2500000 },
  WELCOME5: { type: 'PERCENTAGE', value: 5, minOrderValue: 3000000, maxDiscountAmount: 1000000 },
};

function calculateDiscount(couponCode: string | null, subtotal: number): number {
  if (!couponCode) return 0;
  const c = KNOWN_COUPONS[couponCode.toUpperCase()];
  if (!c) return 0;
  if (subtotal < c.minOrderValue) return 0;
  if (c.type === 'FIXED') {
    return Math.min(c.value, subtotal);
  } else {
    const raw = Math.round((subtotal * c.value) / 100);
    return c.maxDiscountAmount ? Math.min(raw, c.maxDiscountAmount) : raw;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a random session ID for guest carts
const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
};

const getLocalCart = (sessionId: string): Cart => {
  if (typeof window === 'undefined') {
    return {
      id: 'local-cart',
      userId: null,
      sessionId,
      items: [],
      couponCode: null,
      subtotal: 0,
      discount: 0,
      total: 0,
      status: 'ACTIVE',
      expiresAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem('nfi_cart_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  return {
    id: 'local-cart',
    userId: null,
    sessionId,
    items: [],
    couponCode: null,
    subtotal: 0,
    discount: 0,
    total: 0,
    status: 'ACTIVE',
    expiresAt: new Date().toISOString(),
  };
};

const saveLocalCart = (cart: Cart) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('nfi_cart_state', JSON.stringify(cart));
  } catch {
    // Ignore storage quota
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);
    const cached = getLocalCart(sid);
    setCart(cached);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await CartService.getCart(sessionId);
      const cartData = response?.data;
      if (cartData && Array.isArray(cartData.items) && cartData.items.length > 0) {
        setCart(cartData);
        saveLocalCart(cartData);
      }
    } catch {
      // Keep local cached cart
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: AddItemRequest) => {
    try {
      const response = await CartService.addItem(item, sessionId);
      if (response?.data && Array.isArray(response.data.items)) {
        setCart(response.data);
        saveLocalCart(response.data);
        setIsCartOpen(true);
        return;
      }
    } catch {
      // Local fallback
    }

    // Client-side fallback with authentic product metadata
    setCart((prev) => {
      const current = prev || getLocalCart(sessionId);
      const mockItem: CartItem = {
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku || `NFI-${item.productId.slice(0, 6).toUpperCase()}`,
        name: item.name || 'Bespoke Solid Wood Commission',
        image:
          item.image ||
          'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=600&auto=format&fit=crop',
        unitPrice: item.unitPrice || 6800000,
        quantity: item.quantity,
        addedAt: new Date().toISOString(),
      };

      const existingIndex = current.items.findIndex((i) => i.variantId === item.variantId);
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = current.items.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      } else {
        newItems = [...current.items, mockItem];
      }

      const subtotal = newItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const discount = calculateDiscount(current.couponCode, subtotal);
      const total = Math.max(0, subtotal - discount);
      const updatedCart: Cart = {
        ...current,
        items: newItems,
        subtotal,
        discount,
        total,
      };

      saveLocalCart(updatedCart);
      return updatedCart;
    });

    setIsCartOpen(true);
  };

  const updateItem = async (variantId: string, quantity: number) => {
    try {
      const response = await CartService.updateItem(variantId, quantity, sessionId);
      if (response?.data && Array.isArray(response.data.items)) {
        setCart(response.data);
        saveLocalCart(response.data);
        return;
      }
    } catch {
      // Local fallback
    }

    setCart((prev) => {
      if (!prev) return null;
      let newItems: CartItem[];
      if (quantity <= 0) {
        newItems = prev.items.filter((i) => i.variantId !== variantId);
      } else {
        newItems = prev.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
      }
      const subtotal = newItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const discount = calculateDiscount(prev.couponCode, subtotal);
      const total = Math.max(0, subtotal - discount);
      const updated: Cart = { ...prev, items: newItems, subtotal, discount, total };
      saveLocalCart(updated);
      return updated;
    });
  };

  const removeItem = async (variantId: string) => {
    try {
      const response = await CartService.removeItem(variantId, sessionId);
      if (response?.data && Array.isArray(response.data.items)) {
        setCart(response.data);
        saveLocalCart(response.data);
        return;
      }
    } catch {
      // Local fallback
    }

    setCart((prev) => {
      if (!prev) return null;
      const newItems = prev.items.filter((i) => i.variantId !== variantId);
      const subtotal = newItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const discount = calculateDiscount(prev.couponCode, subtotal);
      const total = Math.max(0, subtotal - discount);
      const updated: Cart = { ...prev, items: newItems, subtotal, discount, total };
      saveLocalCart(updated);
      return updated;
    });
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      return { success: false, message: 'Please enter a privilege code.' };
    }

    try {
      const response = await CartService.applyCoupon(trimmed, sessionId);
      if (response?.data) {
        setCart(response.data);
        saveLocalCart(response.data);
        return { success: true };
      }
    } catch (err: unknown) {
      // If server returned a business message, let's surface it
      const apiMsg =
        (err as { response?: { data?: { error?: { message?: string }; message?: string } } })
          ?.response?.data?.error?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (apiMsg) {
        return { success: false, message: apiMsg };
      }
    }

    // Resilient local fallback
    const couponInfo = KNOWN_COUPONS[trimmed];
    if (!couponInfo) {
      return { success: false, message: 'Invalid or unrecognized privilege code.' };
    }

    const currentCart = cart || getLocalCart(sessionId);
    if (!currentCart.items.length) {
      return {
        success: false,
        message: 'Your bag is empty. Add pieces before applying privilege codes.',
      };
    }

    if (currentCart.subtotal < couponInfo.minOrderValue) {
      const minINR = Math.round(couponInfo.minOrderValue / 100).toLocaleString('en-IN');
      return {
        success: false,
        message: `Privilege code requires a minimum order of ₹${minINR}.`,
      };
    }

    const discount = calculateDiscount(trimmed, currentCart.subtotal);
    const updated: Cart = {
      ...currentCart,
      couponCode: trimmed,
      discount,
      total: Math.max(0, currentCart.subtotal - discount),
    };
    setCart(updated);
    saveLocalCart(updated);
    return { success: true };
  };

  const removeCoupon = async () => {
    try {
      const response = await CartService.removeCoupon(sessionId);
      if (response?.data) {
        setCart(response.data);
        saveLocalCart(response.data);
        return;
      }
    } catch {
      // Local fallback
    }

    setCart((prev) => {
      if (!prev) return null;
      const updated: Cart = {
        ...prev,
        couponCode: null,
        discount: 0,
        total: prev.subtotal,
      };
      saveLocalCart(updated);
      return updated;
    });
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const clearCart = () => {
    const empty: Cart = {
      id: 'local-cart',
      userId: null,
      sessionId,
      items: [],
      couponCode: null,
      subtotal: 0,
      discount: 0,
      total: 0,
      status: 'ACTIVE',
      expiresAt: new Date().toISOString(),
    };
    setCart(empty);
    saveLocalCart(empty);
  };

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        openCart,
        closeCart,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
