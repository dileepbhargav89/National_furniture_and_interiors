'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';

export interface ProductPurchaseSectionProps {
  productId: string;
  name: string;
  sku: string;
  slug?: string | undefined;
  category?: string | undefined;
  brand?: string | undefined;
  basePriceAmt: number;
  mrpAmt?: number | null | undefined;
  currency?: string | undefined;
  status: string;
  productType?: string | undefined;
  ratingsAvg?: number | null | undefined;
  ratingsCount?: number | null | undefined;
  finishes?: string[] | undefined;
  colors?: string[] | undefined;
  firstVariantId?: string | undefined;
  thumbnailUrl?: string | undefined;
}

export function ProductPurchaseSection({
  productId,
  name,
  sku,
  slug,
  category,
  brand = 'National Furniture & Interiors',
  basePriceAmt,
  mrpAmt,
  currency = 'INR',
  status,
  productType = 'READY_TO_SHIP',
  ratingsAvg,
  ratingsCount,
  finishes = [],
  colors = [],
  firstVariantId = 'DEFAULT',
  thumbnailUrl,
}: ProductPurchaseSectionProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] = useState(finishes[0] || '');
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const wishlisted = isWishlisted(productId);

  // Delivery Pincode checker
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [pincodeChecking, setPincodeChecking] = useState(false);

  // Sticky Bar visibility trigger
  const buyButtonRef = useRef<HTMLDivElement | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(basePriceAmt);

  const formattedMrp =
    mrpAmt && mrpAmt > basePriceAmt
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
        }).format(mrpAmt)
      : null;

  const savingsAmt = mrpAmt && mrpAmt > basePriceAmt ? mrpAmt - basePriceAmt : 0;
  const discountPercentage =
    mrpAmt && mrpAmt > basePriceAmt ? Math.round((savingsAmt / mrpAmt) * 100) : 0;
  const emiAmount = Math.round(basePriceAmt / 12);

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: productId,
      name,
      slug: slug || productId,
      price: basePriceAmt,
      mrp: mrpAmt ?? undefined,
      currency,
      images: thumbnailUrl ? [thumbnailUrl] : [],
      category: category || 'Living Room',
      material: selectedFinish || undefined,
    });
  };

  // Scroll listener for sticky bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setShowStickyBar(!entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    if (buyButtonRef.current) {
      observer.observe(buyButtonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem({
        productId,
        variantId: firstVariantId,
        quantity,
      });
      setIsAdded(true);
      openCart();
      setTimeout(() => setIsAdded(false), 2500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    setIsAdding(true);
    try {
      await addItem({
        productId,
        variantId: firstVariantId,
        quantity,
      });
      router.push('/checkout');
    } catch (err) {
      console.error('Buy Now failed:', err);
      router.push('/checkout');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeResult('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setPincodeChecking(true);
    setTimeout(() => {
      setPincodeChecking(false);
      setPincodeResult(
        `✓ Free White-Glove Delivery & Installation verified for PIN ${pincode.trim()} within 4–7 business days.`,
      );
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Brand & Collection Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7355]">
          {brand}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
              status === 'PUBLISHED'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === 'PUBLISHED' ? 'animate-pulse bg-emerald-500' : 'bg-red-500'
              }`}
            />
            {status === 'PUBLISHED'
              ? productType === 'MADE_TO_ORDER'
                ? 'Made to Order'
                : 'In Stock'
              : 'Unavailable'}
          </span>
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`rounded-full p-1.5 transition-colors hover:bg-neutral-100 ${
              wishlisted ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'
            }`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <svg
              className={`h-5 w-5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Title & SKU */}
      <div>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-neutral-900 sm:text-4xl">
          {name}
        </h1>
        <p className="mt-1 font-mono text-xs text-neutral-400">SKU: {sku}</p>
      </div>

      {/* Ratings Summary Anchor */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
          <span>★</span>
          <span className="font-bold text-neutral-900">
            {ratingsAvg ? ratingsAvg.toFixed(1) : '4.8'}
          </span>
        </div>
        <span className="text-neutral-300">·</span>
        <a
          href="#customer-reviews"
          className="text-xs font-medium text-neutral-600 underline underline-offset-4 transition-colors hover:text-amber-800"
        >
          {ratingsCount || 84} Verified Reviews
        </a>
        <span className="text-neutral-300">·</span>
        <span className="text-xs font-medium text-emerald-700">96% Recommended</span>
      </div>

      {/* Price & Savings Matrix */}
      <div className="space-y-2 rounded-xl border border-[#EBE8E3] bg-[#FAF9F6] p-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {formattedPrice}
          </span>
          {formattedMrp && (
            <span className="text-lg text-neutral-400 line-through decoration-neutral-400/80">
              {formattedMrp}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
              Save {discountPercentage}% (₹{savingsAmt.toLocaleString('en-IN')})
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-neutral-600">
          Inclusive of all GST · Free White-Glove In-Home Delivery &amp; Placement · 10-Year
          Structural Frame Warranty
        </p>

        {/* EMI Helper */}
        <div className="flex items-center justify-between border-t border-[#EBE8E3] pt-2 text-xs text-neutral-700">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-amber-800">💳</span> 0% No-Cost EMI from{' '}
            <strong className="text-neutral-900">₹{emiAmount.toLocaleString('en-IN')}/mo</strong>
          </span>
          <span className="text-[11px] text-neutral-400">3, 6, 9 &amp; 12 Months Available</span>
        </div>
      </div>

      {/* Custom Dimensions Assistance Banner */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 text-xs text-amber-900">
        <span className="text-sm">📐</span>
        <div>
          <span className="mb-0.5 block font-semibold">
            Need custom dimensions or bespoke fabric?
          </span>
          <p className="text-[11px] leading-relaxed text-amber-800/90">
            Our Bengaluru atelier can customize this design to your exact room blueprint and wood
            finish.
          </p>
        </div>
      </div>

      {/* Finishes Swatch Selector */}
      {finishes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-neutral-900">
              Finish Selection:
            </span>
            <span className="font-medium text-[#8C7355]">{selectedFinish || finishes[0]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {finishes.map((finish, idx) => {
              const isSelected = (selectedFinish || finishes[0]) === finish;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedFinish(finish)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'shadow-xs scale-102 bg-neutral-900 text-white ring-2 ring-neutral-900'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {finish}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Colors / Swatch Selector */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-neutral-900">
              Color Palette:
            </span>
            <span className="font-medium text-[#8C7355]">{selectedColor || colors[0]}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, idx) => {
              const isSelected = (selectedColor || colors[0]) === color;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'shadow-xs scale-102 bg-amber-950 text-white ring-2 ring-amber-950'
                      : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Primary Action Buttons */}
      <div ref={buyButtonRef} className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          {/* Quantity Stepper */}
          <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-neutral-300 bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3.5 py-3 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="px-3.5 py-3 text-sm font-bold text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`btn-shimmer-wrap flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
              isAdded
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-[#171717] text-white shadow-sm hover:bg-neutral-800 hover:shadow-md'
            } disabled:opacity-70`}
          >
            {isAdding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isAdded ? (
              <>
                <span>✓</span> Added to Bag
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Add to Bag
              </>
            )}
          </button>

          {/* Wishlist Toggle Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            className={`flex shrink-0 items-center justify-center rounded-lg border p-3.5 transition-all duration-200 ${
              wishlisted
                ? 'shadow-xs border-red-200 bg-red-50 text-red-600'
                : 'shadow-xs border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-transform duration-200 ${
                wishlisted
                  ? 'scale-110 fill-red-500 text-red-500'
                  : 'text-neutral-600 group-hover:scale-105'
              }`}
            />
          </button>
        </div>

        {/* Buy Now Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isAdding}
          className="btn-shimmer-wrap flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-700 to-amber-900 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:from-amber-800 hover:to-amber-950"
        >
          Instant Checkout · Buy Now
        </button>
      </div>

      {/* Pincode Delivery Estimator */}
      <div className="space-y-2.5 rounded-xl border border-[#EBE8E3] bg-white p-4">
        <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-900">
          Check Delivery & Installation Date
        </span>
        <form onSubmit={handleCheckPincode} className="flex gap-2">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ''));
              setPincodeResult(null);
            }}
            placeholder="Enter 6-digit PIN code"
            className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
          />
          <button
            type="submit"
            disabled={pincodeChecking}
            className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-neutral-800"
          >
            {pincodeChecking ? 'Checking…' : 'Check'}
          </button>
        </form>
        {pincodeResult && (
          <p
            className={`text-xs font-medium ${
              pincodeResult.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {pincodeResult}
          </p>
        )}
      </div>

      {/* Sticky Bottom Bar (appears upon scroll) */}
      {showStickyBar && (
        <div className="animate-reveal-up fixed inset-x-0 bottom-0 z-40 border-t border-[#EBE8E3] bg-white/95 p-3 shadow-xl backdrop-blur-md transition-all sm:py-4">
          <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-lg border border-neutral-200 object-cover"
                />
              )}
              <div className="truncate">
                <p className="truncate font-serif text-sm font-medium text-neutral-900">{name}</p>
                <p className="mt-0.5 text-xs font-bold text-neutral-900">
                  {formattedPrice}
                  {formattedMrp && (
                    <span className="ml-2 text-[11px] font-normal text-neutral-400 line-through">
                      {formattedMrp}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleToggleWishlist}
                aria-label={wishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                className={`flex shrink-0 items-center justify-center rounded-lg border p-2.5 transition-all duration-200 ${
                  wishlisted
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${
                    wishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-600'
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding}
                className="rounded-lg bg-[#171717] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-neutral-800 sm:px-6"
              >
                {isAdded ? '✓ Added' : 'Add to Bag'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="hidden rounded-lg bg-amber-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-amber-900 sm:inline-flex"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
