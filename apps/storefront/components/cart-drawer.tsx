'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '../context/cart-context';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateItem,
    removeItem,
    itemCount,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const [visible, setVisible] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    },
    [isCartOpen, closeCart],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Animate in/out via CSS classes rather than abrupt unmount
  useEffect(() => {
    if (isCartOpen) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [isCartOpen]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a privilege code.');
      return;
    }
    setIsApplying(true);
    setCouponError(null);
    try {
      const res = await applyCoupon(code);
      if (res.success) {
        setCouponInput('');
        setShowCouponForm(false);
      } else {
        setCouponError(res.message || 'Invalid privilege code.');
      }
    } catch {
      setCouponError('Unable to apply privilege code. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsApplying(true);
    setCouponError(null);
    try {
      await removeCoupon();
    } finally {
      setIsApplying(false);
    }
  };

  if (!isCartOpen && !visible) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`backdrop-blur-xs fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        className={`fixed inset-y-0 right-0 z-[101] flex w-full max-w-[440px] flex-col bg-white text-[#171717] shadow-2xl transition-transform duration-300 ease-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-[#FAF9F6] px-6 py-5">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-base font-semibold tracking-tight text-[#171717]">
              Bespoke Cart &amp; Selection
            </h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-[#8C7355] px-2 py-0.5 text-[11px] font-bold text-white">
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close cart drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Brand Trust Strip */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-100/70 px-6 py-2.5 text-[11px] text-stone-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#8C7355]" />
            10-Year Frame Warranty
          </span>
          <span className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-[#8C7355]" />
            Free White-Glove In-Home Setup
          </span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto">
          {!cart || cart.items.length === 0 ? (
            /* Luxury Empty State */
            <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
              <div className="shadow-xs mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-[#FAF9F6] text-[#8C7355]">
                <ShoppingBag className="h-9 w-9 stroke-1" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-semibold text-[#171717]">
                Your Bag is Empty
              </h3>
              <p className="mb-6 max-w-xs text-xs leading-relaxed text-stone-500">
                Each piece in our atelier is handcrafted to commission from seasoned timber.
                Discover our signature suites and dining centerpieces.
              </p>

              {/* Discovery Pills */}
              <div className="mb-6 flex max-w-xs flex-wrap items-center justify-center gap-2">
                <Link
                  href="/products?category=living-room"
                  onClick={closeCart}
                  className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium transition-colors hover:bg-[#8C7355] hover:text-white"
                >
                  Living Room
                </Link>
                <Link
                  href="/products?category=dining"
                  onClick={closeCart}
                  className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium transition-colors hover:bg-[#8C7355] hover:text-white"
                >
                  Dining Tables
                </Link>
                <Link
                  href="/products?category=bedroom"
                  onClick={closeCart}
                  className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium transition-colors hover:bg-[#8C7355] hover:text-white"
                >
                  Bedroom Suites
                </Link>
                <Link
                  href="#design-consultation"
                  onClick={closeCart}
                  className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
                >
                  Turnkey Interiors
                </Link>
              </div>

              <div className="flex w-full max-w-xs flex-col gap-2.5">
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="shadow-xs w-full rounded-xl bg-[#171717] py-3 text-center text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-stone-800"
                >
                  Browse Full Catalog (90+ Pieces)
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 px-6">
              {cart.items.map((item) => (
                <li key={item.variantId} className="group flex gap-4 py-5">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-[#FAF9F6]">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-serif text-xs font-semibold leading-snug text-[#171717]">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="p-1 text-stone-300 transition-colors hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-stone-400">SKU: {item.sku}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-dashed border-stone-100 pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                        <button
                          className="flex h-7 w-7 items-center justify-center text-stone-500 transition-colors hover:bg-white hover:text-black disabled:opacity-30"
                          onClick={() => updateItem(item.variantId, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center text-stone-500 transition-colors hover:bg-white hover:text-black"
                          onClick={() => updateItem(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <p className="text-xs font-bold text-[#171717]">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Totals & CTA */}
        {cart && cart.items.length > 0 && (
          <div className="space-y-3.5 border-t border-stone-200 bg-[#FAF9F6] px-6 py-4 shadow-lg">
            {/* Patron Privilege Code Section */}
            <div className="pt-1">
              {cart.couponCode ? (
                <div className="shadow-xs flex items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-amber-50/90 via-[#FAF9F6] to-amber-50/70 p-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#8C7355]/30 bg-[#8C7355]/15 text-[#8C7355]">
                      <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold tracking-wider text-[#171717]">
                          {cart.couponCode}
                        </span>
                        <span className="py-0.2 rounded bg-emerald-100/80 px-1.5 text-[10px] font-bold uppercase text-emerald-800">
                          Privilege Active
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-700">
                        Artisan savings of {formatPrice(cart.discount)} applied
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    disabled={isApplying}
                    className="flex min-h-[44px] shrink-0 items-center rounded-lg px-3 py-2 text-[11px] font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove privilege code"
                  >
                    {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Remove'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCouponForm(!showCouponForm)}
                    className="flex w-full items-center justify-between py-1.5 text-xs font-medium text-stone-600 transition-colors hover:text-[#171717]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#8C7355]" />
                      <span className="font-serif">Have an Atelier Privilege Code?</span>
                    </span>
                    {showCouponForm ? (
                      <ChevronUp className="h-3.5 w-3.5 text-stone-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-stone-400" />
                    )}
                  </button>

                  {showCouponForm && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="e.g. SPRING2026"
                          className="min-h-[44px] flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon()}
                          disabled={isApplying || !couponInput.trim()}
                          className="shadow-xs flex min-h-[44px] min-w-[70px] items-center justify-center rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#8C7355] disabled:opacity-40"
                        >
                          {isApplying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                        </button>
                      </div>

                      {couponError && (
                        <p className="rounded-lg border border-rose-200/70 bg-rose-50 px-3 py-2 text-[11px] leading-snug text-rose-700">
                          {couponError}
                        </p>
                      )}

                      {/* Quick recommendations */}
                      <div className="pt-1">
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                          Available Atelier Privilege Codes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { code: 'SPRING2026', label: '10% off > ₹50K' },
                            { code: 'EXTRA10K', label: '₹10K off > ₹1L' },
                            { code: 'NFI10', label: '10% off > ₹75K' },
                          ].map((rec) => (
                            <button
                              key={rec.code}
                              type="button"
                              onClick={() => handleApplyCoupon(rec.code)}
                              disabled={isApplying}
                              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-stone-200 bg-stone-100 px-2.5 py-1.5 font-mono text-[11px] text-stone-700 transition-colors hover:border-[#8C7355]/40 hover:bg-[#8C7355]/10 hover:text-[#8C7355]"
                            >
                              <span className="font-bold">{rec.code}</span>
                              <span className="text-[10px] text-stone-400">({rec.label})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t border-stone-200/80 pt-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Commission Subtotal</span>
                <span className="font-medium text-stone-900">{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between font-medium text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                    <span>Artisan Privilege ({cart.couponCode})</span>
                  </span>
                  <span>−{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>White-Glove Delivery (Bengaluru)</span>
                <span className="font-medium text-emerald-800">Complimentary</span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2.5 text-sm font-bold text-[#171717]">
                <span className="font-serif">Estimated Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-stone-400">
              Inclusive of GST · Moisture testing &amp; 10-Yr warranty included
            </p>

            <div className="space-y-2">
              <Link href="/checkout" onClick={closeCart} className="block">
                <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#171717] py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#8C7355]">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>

              <Link href="/cart" onClick={closeCart} className="block">
                <button className="min-h-[40px] w-full rounded-xl border border-stone-300 bg-white py-2.5 text-center text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50">
                  Review Full Cart &amp; Pincode Delivery
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
