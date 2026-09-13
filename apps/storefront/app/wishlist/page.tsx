'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Phone,
  MessageCircle,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useWishlist, WishlistItem } from '../../context/wishlist-context';
import { useCart } from '../../context/cart-context';

const RECOMMENDED_PIECES = [
  {
    id: 'rec-1',
    name: 'The Indiranagar Burma Teak Dining Table',
    slug: 'the-indiranagar-burma-teak-dining-table',
    price: 6800000,
    mrp: 8500000,
    currency: 'INR',
    images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=800&auto=format&fit=crop'],
    category: 'Dining Room',
    material: 'Kiln-Seasoned Burma Teak',
  },
  {
    id: 'rec-2',
    name: 'Koramangala Minimalist Bouclé Lounge Chair',
    slug: 'koramangala-minimalist-boucle-lounge-chair',
    price: 3400000,
    mrp: 4200000,
    currency: 'INR',
    images: ['https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop'],
    category: 'Living Room',
    material: 'Belgian Bouclé & Teak Frame',
  },
  {
    id: 'rec-3',
    name: 'Whitefield Architectural Media Credenza',
    slug: 'whitefield-architectural-media-credenza',
    price: 4800000,
    mrp: 5800000,
    currency: 'INR',
    images: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800&auto=format&fit=crop'],
    category: 'Storage & Credenzas',
    material: 'Century 710 Marine Ply & Brass',
  },
  {
    id: 'rec-4',
    name: 'HSR Low-Slung Platform Teak Bed',
    slug: 'hsr-low-slung-platform-teak-bed',
    price: 7400000,
    mrp: 9200000,
    currency: 'INR',
    images: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop'],
    category: 'Bedroom',
    material: 'Solid Teak & Century Ply',
  },
];

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist, toggleWishlist, isWishlisted } = useWishlist();
  const { addItem, openCart } = useCart();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [addedAll, setAddedAll] = useState(false);

  const formatPrice = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const totalValue = items.reduce((sum, item) => sum + item.price, 0);
  const totalMrp = items.reduce((sum, item) => sum + (item.mrp || item.price), 0);
  const totalSavings = totalMrp > totalValue ? totalMrp - totalValue : 0;

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      setMovingId(item.id);
      await addItem({
        productId: item.id,
        variantId: item.id,
        quantity: 1,
      });
      removeFromWishlist(item.id);
      openCart();
    } catch (e) {
      console.error('Failed to move item to cart:', e);
    } finally {
      setMovingId(null);
    }
  };

  const handleAddAllToCart = async () => {
    if (items.length === 0) return;
    setAddedAll(true);
    try {
      for (const item of items) {
        await addItem({
          productId: item.id,
          variantId: item.id,
          quantity: 1,
        });
      }
      openCart();
    } catch (e) {
      console.error('Failed to add all items to cart:', e);
    } finally {
      setTimeout(() => setAddedAll(false), 2000);
    }
  };

  return (
    <div className="bg-[#FAF9F6] text-neutral-900 min-h-screen selection:bg-[#8C7355] selection:text-white pb-24">
      {/* ── 1. BREADCRUMBS & HEADER ──────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 pt-28 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-xs text-neutral-500">
              <li>
                <Link href="/" className="hover:text-neutral-900 flex items-center gap-1 transition-colors">
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </li>
              <li className="text-neutral-900 font-semibold">Saved Wishlist</li>
            </ol>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-1">
                Your Personal Curation
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900">
                Saved Furniture & Suites
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1.5">
                {items.length === 0
                  ? 'No pieces saved yet. Explore our Bengaluru showroom pieces to build your wishlist.'
                  : `You have saved ${items.length} bespoke architectural ${items.length === 1 ? 'piece' : 'pieces'}.`}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearWishlist}
                className="text-xs text-neutral-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Items</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. ACTIVE WISHLIST OR EMPTY STATE ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {items.length > 0 ? (
          <div className="space-y-8">
            {/* Top Summary Bar */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500 block">
                    Wishlist Valuation
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
                      {formatPrice(totalValue)}
                    </span>
                    {totalSavings > 0 && (
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPrice(totalMrp)}
                      </span>
                    )}
                  </div>
                </div>

                {totalSavings > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/60">
                    <span className="text-xs font-semibold text-emerald-800">
                      You Save {formatPrice(totalSavings)} (Factory-Direct)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  disabled={addedAll}
                  className="px-6 py-3 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedAll ? 'All Items Added!' : 'Move All To Cart'}</span>
                </button>
                <Link
                  href="/design-services#lead-form"
                  className="px-5 py-3 bg-white border border-neutral-300 text-neutral-800 hover:border-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
                >
                  Book Free Styling Visit
                </Link>
              </div>
            </div>

            {/* Wishlist Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                const itemSavings = item.mrp && item.mrp > item.price ? item.mrp - item.price : 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:border-[#8C7355]/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                        <Link href={`/products/${item.slug}`}>
                          <Image
                            src={
                              item.images && item.images[0]
                                ? item.images[0]
                                : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop'
                            }
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.id)}
                          aria-label={`Remove ${item.name} from wishlist`}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-neutral-600 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[#8C7355] uppercase tracking-wider mb-1">
                          <span>{item.category || 'Living Piece'}</span>
                          <span className="text-emerald-700 font-normal">● In Stock</span>
                        </div>

                        <Link href={`/products/${item.slug}`}>
                          <h3 className="font-serif text-base font-medium text-neutral-900 group-hover:text-[#8C7355] transition-colors line-clamp-1">
                            {item.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          {item.material || 'Solid Burma Teak & Century Marine Ply'}
                        </p>

                        <div className="flex items-baseline gap-2 mt-3">
                          <span className="font-serif text-lg font-bold text-neutral-900">
                            {formatPrice(item.price, item.currency)}
                          </span>
                          {item.mrp && item.mrp > item.price && (
                            <span className="text-xs text-neutral-400 line-through">
                              {formatPrice(item.mrp, item.currency)}
                            </span>
                          )}
                          {itemSavings > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              Save {formatPrice(itemSavings)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-5 pt-0 border-t border-neutral-100 mt-2">
                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        disabled={movingId === item.id}
                        className="w-full mt-3 py-2.5 px-4 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{movingId === item.id ? 'Moving...' : 'Move to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white border border-neutral-200 rounded-2xl shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-neutral-200 text-[#8C7355] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 mb-2">
              Your Wishlist is Empty
            </h2>

            <p className="text-neutral-500 text-xs sm:text-sm font-light leading-relaxed max-w-md mx-auto mb-8">
              Save your favorite bespoke teak dining sets, architectural sofas, and bedroom suites as you browse our Bengaluru collections.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/products"
                className="px-7 py-3 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Explore Furniture Catalog
              </Link>
              <Link
                href="/collections"
                className="px-7 py-3 bg-[#FAF9F6] border border-neutral-300 hover:border-neutral-900 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
              >
                Browse Curated Suites
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. CURATED RECOMMENDATIONS SECTION ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-12 border-t border-neutral-200/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-1">
              Bengaluru Architectural Favorites
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900">
              Pieces Frequently Added to Wishlists
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-[#8C7355] hover:underline flex items-center gap-1"
          >
            <span>View All Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {RECOMMENDED_PIECES.map((piece) => {
            const alreadyWishlisted = isWishlisted(piece.id);
            return (
              <div
                key={piece.id}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:border-[#8C7355]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                    <Link href={`/products/${piece.slug}`}>
                      <Image
                        src={piece.images[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop'}
                        alt={piece.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(piece)}
                      aria-label={`Save ${piece.name} to wishlist`}
                      className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-colors shadow-sm ${
                        alreadyWishlisted
                          ? 'bg-[#8C7355] text-white'
                          : 'bg-white/90 text-neutral-600 hover:text-rose-600 hover:bg-white'
                      }`}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={alreadyWishlisted ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] font-semibold text-[#8C7355] uppercase tracking-wider block mb-1">
                      {piece.category}
                    </span>
                    <Link href={`/products/${piece.slug}`}>
                      <h3 className="font-serif text-sm font-medium text-neutral-900 group-hover:text-[#8C7355] transition-colors line-clamp-1">
                        {piece.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                      {piece.material}
                    </p>

                    <div className="flex items-baseline gap-2 mt-2.5">
                      <span className="font-serif text-base font-bold text-neutral-900">
                        {formatPrice(piece.price, piece.currency)}
                      </span>
                      <span className="text-xs text-neutral-400 line-through">
                        {formatPrice(piece.mrp, piece.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(piece)}
                    className={`w-full py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors border ${
                      alreadyWishlisted
                        ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-white border-neutral-300 text-neutral-900 hover:border-neutral-900'
                    }`}
                  >
                    {alreadyWishlisted ? 'Saved In Wishlist' : 'Add to Wishlist'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. CUSTOMER CONFIDENCE STRIP ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 mt-16">
        <div className="bg-[#171717] text-white rounded-2xl p-8 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">
              Have Questions About Your Saved Pieces?
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-light text-white">
              Speak With Our Senior Interior Consultants
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Share your floor plan or saved wishlist for custom dimensions and factory-direct quotations.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="https://wa.me/919663628302?text=Hi%20National%20Furniture%20%26%20Interiors%2C%20I%20have%20saved%20some%20pieces%20on%20my%20wishlist%20and%20would%20like%20to%20discuss%20pricing%20and%20dimensions."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href="tel:+919663628302"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call +91 9663628302</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
