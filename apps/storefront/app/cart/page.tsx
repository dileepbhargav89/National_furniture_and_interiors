'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/cart-context';
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Award,
  Tag,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart, itemCount, applyCoupon, removeCoupon } =
    useCart();

  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState<string | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a privilege code.');
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await applyCoupon(code);
      if (res.success) {
        setCouponInput('');
      } else {
        setCouponError(res.message || 'Invalid privilege code.');
      }
    } catch {
      setCouponError('Unable to apply privilege code. Please try again.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      await removeCoupon();
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      setPincodeMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    setCheckingPincode(true);
    setTimeout(() => {
      setCheckingPincode(false);
      setPincodeMsg('✓ Complimentary White-Glove Delivery & Room Assembly available in Bengaluru!');
    }, 450);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello National Furniture & Interiors Concierge, I have items in my bag and would like assistance regarding custom dimensions and delivery scheduling.`,
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20 pt-28 selection:bg-[#8C7355]/20 selection:text-[#171717]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Continue Exploring Furniture</span>
          </Link>

          {itemCount > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-stone-400 transition-colors hover:text-red-600"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-[#8C7355]/10 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#8C7355]">
              Bengaluru Workshop Selection
            </span>
            <span className="text-xs text-stone-400">
              {itemCount} {itemCount === 1 ? 'Piece Selected' : 'Pieces Selected'}
            </span>
          </div>
          <h1 className="font-serif text-2xl tracking-tight text-[#171717] sm:text-3xl">
            Your Bespoke Furniture Cart
          </h1>
        </div>

        {/* Cart Content or Empty State */}
        {!cart || cart.items.length === 0 ? (
          <div className="shadow-xs mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-12 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-200 bg-[#FAF9F6] text-[#8C7355]">
              <ShoppingBag className="h-9 w-9 stroke-1" />
            </div>
            <h2 className="mb-2 font-serif text-xl font-semibold text-[#171717]">
              Your Commission Bag is Empty
            </h2>
            <p className="mb-6 text-xs leading-relaxed text-stone-500">
              Explore our Burma Teak dining tables, Italian leather lounges, and fluted credenzas
              handcrafted in our 40,000 sq.ft Bengaluru atelier.
            </p>

            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/products?category=living"
                className="rounded-lg bg-stone-100 px-3.5 py-1.5 text-[11px] font-medium text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white"
              >
                Living Room
              </Link>
              <Link
                href="/products?category=dining"
                className="rounded-lg bg-stone-100 px-3.5 py-1.5 text-[11px] font-medium text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white"
              >
                Dining Tables
              </Link>
              <Link
                href="/products?category=bedroom"
                className="rounded-lg bg-stone-100 px-3.5 py-1.5 text-[11px] font-medium text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white"
              >
                Bedroom Suites
              </Link>
              <Link
                href="/design-services"
                className="rounded-lg bg-stone-100 px-3.5 py-1.5 text-[11px] font-medium text-stone-700 transition-colors hover:bg-[#8C7355] hover:text-white"
              >
                Turnkey Interiors
              </Link>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/collections"
                className="w-full rounded-xl bg-[#171717] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#8C7355] sm:w-auto"
              >
                Curated Suites
              </Link>
              <Link
                href="/products"
                className="w-full rounded-xl border border-stone-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#171717] transition-colors hover:bg-stone-50 sm:w-auto"
              >
                Browse All Furniture
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left 8 Cols: Pieces List */}
            <div className="space-y-6 lg:col-span-8">
              <div className="shadow-xs overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between border-b border-stone-100 bg-[#FAF9F6] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-stone-600">
                  <span>Commissioned Items ({cart.items.length})</span>
                  <span className="hidden sm:inline">Price &amp; Quantity</span>
                </div>

                <div className="divide-y divide-stone-100">
                  {cart.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex flex-col gap-5 p-6 transition-colors hover:bg-stone-50/40 sm:flex-row"
                    >
                      {/* Image */}
                      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-[#FAF9F6] sm:w-28">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-serif text-sm font-semibold text-[#171717] sm:text-base">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="p-1 text-stone-300 transition-colors hover:text-red-500"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-stone-500">
                              SKU: {item.sku}
                            </span>
                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-800">
                              10-Yr Warranty
                            </span>
                          </div>
                        </div>

                        {/* Controls & Price */}
                        <div className="mt-4 flex items-center justify-between border-t border-dashed border-stone-100 pt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                              <button
                                className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-white hover:text-black disabled:opacity-30"
                                onClick={() =>
                                  updateItem(item.variantId, Math.max(1, item.quantity - 1))
                                }
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold text-stone-800">
                                {item.quantity}
                              </span>
                              <button
                                className="flex h-8 w-8 items-center justify-center text-stone-500 transition-colors hover:bg-white hover:text-black"
                                onClick={() => updateItem(item.variantId, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-xs text-stone-400">
                              @ {formatPrice(item.unitPrice)} each
                            </span>
                          </div>

                          <span className="text-sm font-bold text-[#171717]">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Pincode Checker */}
              <div className="shadow-xs rounded-2xl border border-stone-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#8C7355]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
                    Bengaluru Delivery &amp; Assembly Checker
                  </h3>
                </div>
                <form onSubmit={handlePincodeCheck} className="flex max-w-md gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, ''));
                      setPincodeMsg(null);
                    }}
                    placeholder="Enter 6-digit Bengaluru PIN code (e.g. 560038)"
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                  />
                  <button
                    type="submit"
                    disabled={checkingPincode}
                    className="rounded-xl bg-[#171717] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800"
                  >
                    {checkingPincode ? 'Checking…' : 'Verify'}
                  </button>
                </form>
                {pincodeMsg && (
                  <p
                    className={`mt-2.5 text-xs font-medium ${pincodeMsg.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}
                  >
                    {pincodeMsg}
                  </p>
                )}
              </div>

              {/* White Glove Promise Strip */}
              <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-stone-900 p-6 text-white sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#D4AF37]">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-medium">
                      National White-Glove Standard
                    </h4>
                    <p className="mt-0.5 text-xs text-stone-300">
                      Air-suspension delivery, placement in room, felt floor guards, and zero waste
                      left behind.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 font-mono text-xs uppercase text-[#D4AF37]">
                  Included Free
                </span>
              </div>
            </div>

            {/* Right 4 Cols: Summary */}
            <div className="space-y-6 lg:col-span-4">
              {/* Patron Privilege Card */}
              <div className="shadow-xs space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
                <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                  <Tag className="h-4 w-4 text-[#8C7355]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
                    Patron Privilege &amp; Atelier Benefit
                  </h3>
                </div>

                {cart.couponCode ? (
                  <div className="shadow-xs flex items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-amber-50/90 via-[#FAF9F6] to-amber-50/70 p-4 text-xs">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#8C7355]/30 bg-[#8C7355]/15 text-[#8C7355]">
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wider text-[#171717]">
                            {cart.couponCode}
                          </span>
                          <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                            Active
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-emerald-700">
                          Artisan savings of {formatPrice(cart.discount)} applied
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      disabled={isApplyingCoupon}
                      className="flex min-h-[44px] shrink-0 items-center rounded-xl px-3.5 py-2 text-xs font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleApplyCoupon();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError(null);
                        }}
                        placeholder="Enter privilege code"
                        className="min-h-[44px] flex-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="shadow-xs flex min-h-[44px] min-w-[76px] items-center justify-center rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#8C7355] disabled:opacity-40"
                      >
                        {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </button>
                    </form>

                    {couponError && (
                      <p className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-xs leading-snug text-rose-700">
                        {couponError}
                      </p>
                    )}

                    <div className="pt-1">
                      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-stone-400">
                        Recommended Atelier Privilege Codes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { code: 'SPRING2026', label: '10% off above ₹50K' },
                          { code: 'EXTRA10K', label: '₹10,000 flat above ₹1L' },
                          { code: 'NFI10', label: '10% off above ₹75K' },
                          { code: 'WELCOME5', label: '5% off first order' },
                        ].map((rec) => (
                          <button
                            key={rec.code}
                            type="button"
                            onClick={() => handleApplyCoupon(rec.code)}
                            disabled={isApplyingCoupon}
                            className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700 transition-colors hover:border-[#8C7355]/40 hover:bg-[#8C7355]/10 hover:text-[#8C7355]"
                          >
                            <span className="font-bold">{rec.code}</span>
                            <span className="text-[11px] text-stone-400">({rec.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="shadow-xs sticky top-28 rounded-2xl border border-stone-200 bg-white p-6">
                <h3 className="mb-4 border-b border-stone-100 pb-3 text-sm font-semibold uppercase tracking-wider text-[#171717]">
                  Financial Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Commission Subtotal</span>
                    <span className="font-medium text-stone-900">{formatPrice(cart.subtotal)}</span>
                  </div>

                  {cart.discount > 0 && (
                    <div className="flex justify-between font-medium text-emerald-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                        <span>Artisan Privilege ({cart.couponCode})</span>
                      </span>
                      <span>−{formatPrice(cart.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>White-Glove Delivery (Bengaluru)</span>
                    <span className="font-medium text-emerald-800">Complimentary</span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>Estimated GST (CGST 9% + SGST 9%)</span>
                    <span className="text-stone-800">
                      {formatPrice(Math.round(cart.total * 0.18))}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-stone-200 pt-3">
                    <div>
                      <span className="block text-sm font-bold text-[#171717]">Grand Total</span>
                      <span className="text-[10px] text-stone-400">
                        All Karnataka taxes included
                      </span>
                    </div>
                    <span className="font-serif text-xl font-bold text-[#171717]">
                      {formatPrice(cart.total + Math.round(cart.total * 0.18))}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5">
                  <Link href="/checkout" className="block">
                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#8C7355]">
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>

                  <a
                    href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Workshop Help</span>
                  </a>
                </div>

                <div className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>30-45 Days Handcrafted Build Cycle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>10-Year Comprehensive Structural Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>Verified Moisture Testing (8%-10% EMC)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
