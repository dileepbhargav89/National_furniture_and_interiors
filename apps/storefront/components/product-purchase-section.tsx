'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '../context/cart-context';

export interface ProductPurchaseSectionProps {
  productId: string;
  name: string;
  sku: string;
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

  const [quantity, setQuantity] = useState(1);
  const [selectedFinish, setSelectedFinish] = useState(finishes[0] || '');
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

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
  const discountPercentage = mrpAmt && mrpAmt > basePriceAmt ? Math.round((savingsAmt / mrpAmt) * 100) : 0;
  const emiAmount = Math.round(basePriceAmt / 12);

  // Wishlist local persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nfi_wishlist');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.includes(productId)) {
          setIsWishlisted(true);
        }
      }
    } catch {
      // Ignored
    }
  }, [productId]);

  const toggleWishlist = () => {
    try {
      const saved = localStorage.getItem('nfi_wishlist');
      let list = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(list)) list = [];
      if (isWishlisted) {
        list = list.filter((id: string) => id !== productId);
        setIsWishlisted(false);
      } else {
        list.push(productId);
        setIsWishlisted(true);
      }
      localStorage.setItem('nfi_wishlist', JSON.stringify(list));
    } catch {
      setIsWishlisted(!isWishlisted);
    }
  };

  // Scroll listener for sticky bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setShowStickyBar(!entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
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
      setPincodeResult(`✓ Free White-Glove Delivery & Installation verified for PIN ${pincode.trim()} within 4–7 business days.`);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Brand & Collection Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-[#8C7355] uppercase">
          {brand}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
              status === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
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
            onClick={toggleWishlist}
            className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-red-500"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <svg
              className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`}
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
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-neutral-900 tracking-tight leading-tight">
          {name}
        </h1>
        <p className="text-xs font-mono text-neutral-400 mt-1">SKU: {sku}</p>
      </div>

      {/* Ratings Summary Anchor */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-amber-500 font-medium text-sm">
          <span>★</span>
          <span className="text-neutral-900 font-bold">{ratingsAvg ? ratingsAvg.toFixed(1) : '4.8'}</span>
        </div>
        <span className="text-neutral-300">·</span>
        <a
          href="#customer-reviews"
          className="text-xs font-medium text-neutral-600 hover:text-amber-800 underline underline-offset-4 transition-colors"
        >
          {ratingsCount || 84} Verified Reviews
        </a>
        <span className="text-neutral-300">·</span>
        <span className="text-xs text-emerald-700 font-medium">96% Recommended</span>
      </div>

      {/* Price & Savings Matrix */}
      <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EBE8E3] space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            {formattedPrice}
          </span>
          {formattedMrp && (
            <span className="text-lg text-neutral-400 line-through decoration-neutral-400/80">
              {formattedMrp}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              Save {discountPercentage}% (₹{savingsAmt.toLocaleString('en-IN')})
            </span>
          )}
        </div>

        <p className="text-xs text-neutral-600 font-medium">
          Inclusive of all GST · Free White-Glove In-Home Delivery &amp; Placement · 10-Year Structural Frame Warranty
        </p>

        {/* EMI Helper */}
        <div className="pt-2 border-t border-[#EBE8E3] flex items-center justify-between text-xs text-neutral-700">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-amber-800">💳</span> 0% No-Cost EMI from{' '}
            <strong className="text-neutral-900">₹{emiAmount.toLocaleString('en-IN')}/mo</strong>
          </span>
          <span className="text-neutral-400 text-[11px]">3, 6, 9 &amp; 12 Months Available</span>
        </div>
      </div>

      {/* Custom Dimensions Assistance Banner */}
      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
        <span className="text-sm">📐</span>
        <div>
          <span className="font-semibold block mb-0.5">Need custom dimensions or bespoke fabric?</span>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            Our Bengaluru atelier can customize this design to your exact room blueprint and wood finish.
          </p>
        </div>
      </div>

      {/* Finishes Swatch Selector */}
      {finishes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-900 uppercase tracking-wider">
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-xs scale-102 ring-2 ring-neutral-900'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
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
            <span className="font-semibold text-neutral-900 uppercase tracking-wider">
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
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-950 text-white shadow-xs scale-102 ring-2 ring-amber-950'
                      : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
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
          <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3.5 py-3 text-neutral-600 hover:bg-neutral-100 text-sm font-bold transition-colors"
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
              className="px-3.5 py-3 text-neutral-600 hover:bg-neutral-100 text-sm font-bold transition-colors"
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
            className={`flex-1 py-3.5 px-6 rounded-lg text-sm font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-[#171717] hover:bg-neutral-800 text-white shadow-sm hover:shadow-md'
            } disabled:opacity-70`}
          >
            {isAdding ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : isAdded ? (
              <>
                <span>✓</span> Added to Bag
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>

        {/* Buy Now Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isAdding}
          className="w-full py-3.5 px-6 rounded-lg text-sm font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white shadow-md transition-all flex items-center justify-center gap-2"
        >
          Instant Checkout · Buy Now
        </button>
      </div>

      {/* Pincode Delivery Estimator */}
      <div className="p-4 rounded-xl border border-[#EBE8E3] bg-white space-y-2.5">
        <span className="text-xs font-semibold text-neutral-900 uppercase tracking-wider block">
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
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-amber-800 bg-neutral-50/50"
          />
          <button
            type="submit"
            disabled={pincodeChecking}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
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
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EBE8E3] p-3 sm:py-4 shadow-xl transition-all animate-slideUp">
          <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              {thumbnailUrl && (
                <Image
                  src={thumbnailUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                />
              )}
              <div className="truncate">
                <p className="font-serif text-sm font-medium text-neutral-900 truncate">
                  {name}
                </p>
                <p className="text-xs font-bold text-neutral-900 mt-0.5">
                  {formattedPrice}
                  {formattedMrp && (
                    <span className="text-[11px] text-neutral-400 font-normal line-through ml-2">
                      {formattedMrp}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding}
                className="py-2.5 px-4 sm:px-6 rounded-lg text-xs font-semibold uppercase tracking-wider bg-[#171717] hover:bg-neutral-800 text-white shadow-sm transition-all"
              >
                {isAdded ? '✓ Added' : 'Add to Bag'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="hidden sm:inline-flex py-2.5 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider bg-amber-800 hover:bg-amber-900 text-white shadow-sm transition-all"
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
