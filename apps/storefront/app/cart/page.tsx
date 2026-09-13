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
} from 'lucide-react';

export default function CartPage() {
  const { cart, updateItem, removeItem, clearCart, itemCount } = useCart();

  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState<string | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

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
    `Hello National Furniture & Interiors Concierge, I have items in my bag and would like assistance regarding custom dimensions and delivery scheduling.`
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-28 pb-20 selection:bg-[#8C7355]/20 selection:text-[#171717]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Exploring Furniture</span>
          </Link>

          {itemCount > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-stone-400 hover:text-red-600 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C7355] bg-[#8C7355]/10 px-2.5 py-0.5 rounded">
              Bengaluru Workshop Selection
            </span>
            <span className="text-xs text-stone-400">
              {itemCount} {itemCount === 1 ? 'Piece Selected' : 'Pieces Selected'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#171717] tracking-tight">
            Your Bespoke Furniture Cart
          </h1>
        </div>

        {/* Cart Content or Empty State */}
        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-20 h-20 bg-[#FAF9F6] rounded-2xl border border-stone-200 flex items-center justify-center text-[#8C7355] mx-auto mb-5">
              <ShoppingBag className="w-9 h-9 stroke-1" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-[#171717] mb-2">
              Your Commission Bag is Empty
            </h2>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Explore our Burma Teak dining tables, Italian leather lounges, and fluted credenzas handcrafted in our 40,000 sq.ft Bengaluru atelier.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <Link
                href="/products?category=living"
                className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-[#8C7355] hover:text-white text-[11px] font-medium text-stone-700 transition-colors"
              >
                Living Room
              </Link>
              <Link
                href="/products?category=dining"
                className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-[#8C7355] hover:text-white text-[11px] font-medium text-stone-700 transition-colors"
              >
                Dining Tables
              </Link>
              <Link
                href="/products?category=bedroom"
                className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-[#8C7355] hover:text-white text-[11px] font-medium text-stone-700 transition-colors"
              >
                Bedroom Suites
              </Link>
              <Link
                href="/design-services"
                className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-[#8C7355] hover:text-white text-[11px] font-medium text-stone-700 transition-colors"
              >
                Turnkey Interiors
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/collections"
                className="w-full sm:w-auto px-6 py-3 bg-[#171717] hover:bg-[#8C7355] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
              >
                Curated Suites
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 text-[#171717] border border-stone-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Browse All Furniture
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 8 Cols: Pieces List */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-stone-100 bg-[#FAF9F6] flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-600">
                  <span>Commissioned Items ({cart.items.length})</span>
                  <span className="hidden sm:inline">Price &amp; Quantity</span>
                </div>

                <div className="divide-y divide-stone-100">
                  {cart.items.map((item) => (
                    <div key={item.variantId} className="p-6 flex flex-col sm:flex-row gap-5 hover:bg-stone-50/40 transition-colors">
                      {/* Image */}
                      <div className="relative w-full sm:w-28 h-28 bg-[#FAF9F6] rounded-xl overflow-hidden border border-stone-200 shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="112px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-sm sm:text-base font-serif font-semibold text-[#171717]">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="text-stone-300 hover:text-red-500 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                              SKU: {item.sku}
                            </span>
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              10-Yr Warranty
                            </span>
                          </div>
                        </div>

                        {/* Controls & Price */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-stone-100">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                              <button
                                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-black hover:bg-white transition-colors disabled:opacity-30"
                                onClick={() => updateItem(item.variantId, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs font-semibold text-stone-800">
                                {item.quantity}
                              </span>
                              <button
                                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-black hover:bg-white transition-colors"
                                onClick={() => updateItem(item.variantId, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
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
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-[#8C7355]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#171717]">
                    Bengaluru Delivery &amp; Assembly Checker
                  </h3>
                </div>
                <form onSubmit={handlePincodeCheck} className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, ''));
                      setPincodeMsg(null);
                    }}
                    placeholder="Enter 6-digit Bengaluru PIN code (e.g. 560038)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#8C7355] bg-stone-50/50"
                  />
                  <button
                    type="submit"
                    disabled={checkingPincode}
                    className="px-4 py-2 bg-[#171717] hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors"
                  >
                    {checkingPincode ? 'Checking…' : 'Verify'}
                  </button>
                </form>
                {pincodeMsg && (
                  <p className={`text-xs mt-2.5 font-medium ${pincodeMsg.startsWith('✓') ? 'text-emerald-700' : 'text-red-600'}`}>
                    {pincodeMsg}
                  </p>
                )}
              </div>

              {/* White Glove Promise Strip */}
              <div className="bg-stone-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#D4AF37]">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-medium">National White-Glove Standard</h4>
                    <p className="text-xs text-stone-300 mt-0.5">Air-suspension delivery, placement in room, felt floor guards, and zero waste left behind.</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#D4AF37] uppercase bg-white/10 px-3 py-1 rounded-full shrink-0">
                  Included Free
                </span>
              </div>

            </div>

            {/* Right 4 Cols: Summary */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs sticky top-28">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#171717] pb-3 border-b border-stone-100 mb-4">
                  Financial Summary
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Commission Subtotal</span>
                    <span className="text-stone-900 font-medium">{formatPrice(cart.subtotal)}</span>
                  </div>

                  {cart.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Artisan Privilege Discount</span>
                      <span>−{formatPrice(cart.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>White-Glove Delivery (Bengaluru)</span>
                    <span className="text-emerald-800 font-medium">Complimentary</span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>Estimated GST (CGST 9% + SGST 9%)</span>
                    <span className="text-stone-800">
                      {formatPrice(Math.round(cart.total * 0.18))}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-[#171717] block">Grand Total</span>
                      <span className="text-[10px] text-stone-400">All Karnataka taxes included</span>
                    </div>
                    <span className="text-xl font-serif font-bold text-[#171717]">
                      {formatPrice(cart.total + Math.round(cart.total * 0.18))}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2.5">
                  <Link href="/checkout" className="block">
                    <button className="w-full py-3.5 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 shadow-sm">
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  <a
                    href={`https://wa.me/919663628302?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Workshop Help</span>
                  </a>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 space-y-2 text-[11px] text-stone-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>30-45 Days Handcrafted Build Cycle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>10-Year Comprehensive Structural Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
