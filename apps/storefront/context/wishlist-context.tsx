'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null | undefined;
  currency: string;
  images: string[];
  category: string;
  material?: string | undefined;
  addedAt: number;
}

export type WishlistItemInput = Omit<WishlistItem, 'addedAt'>;

interface WishlistContextType {
  items: WishlistItem[];
  wishlistCount: number;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (item: WishlistItemInput) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = 'nfi_wishlist_items';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } else {
        // Also check if any legacy wishlist_${id} exist in localStorage
        const legacyItems: WishlistItem[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('wishlist_') && localStorage.getItem(key) === 'true') {
            const id = key.replace('wishlist_', '');
            legacyItems.push({
              id,
              name: 'Saved Architectural Furniture',
              slug: id,
              price: 3500000,
              currency: 'INR',
              images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop'],
              category: 'Living Room',
              material: 'Solid Teak',
              addedAt: Date.now(),
            });
          }
        }
        if (legacyItems.length > 0) {
          setItems(legacyItems);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyItems));
        }
      }
    } catch (e) {
      console.warn('Failed to load wishlist from storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever items change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to persist wishlist:', e);
    }
  }, [items, isLoaded]);

  const isWishlisted = (id: string): boolean => {
    return items.some((item) => item.id === id);
  };

  const toggleWishlist = (item: WishlistItemInput) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) {
        try {
          localStorage.removeItem(`wishlist_${item.id}`);
        } catch {
          // ignore
        }
        return prev.filter((i) => i.id !== item.id);
      } else {
        try {
          localStorage.setItem(`wishlist_${item.id}`, 'true');
        } catch {
          // ignore
        }
        return [{ ...item, addedAt: Date.now() }, ...prev];
      }
    });
  };

  const removeFromWishlist = (id: string) => {
    setItems((prev) => {
      try {
        localStorage.removeItem(`wishlist_${id}`);
      } catch {
        // ignore
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearWishlist = () => {
    try {
      items.forEach((item) => {
        localStorage.removeItem(`wishlist_${item.id}`);
      });
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
