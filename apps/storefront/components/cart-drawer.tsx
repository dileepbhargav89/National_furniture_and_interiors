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
} from 'lucide-react';

export function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateItem, removeItem, itemCount } = useCart();
  const [visible, setVisible] = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    },
    [isCartOpen, closeCart]
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
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        className={`fixed inset-y-0 right-0 z-[101] w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out text-[#171717] ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-serif font-semibold tracking-tight text-[#171717]">
              Bespoke Cart &amp; Selection
            </h2>
            {itemCount > 0 && (
              <span className="bg-[#8C7355] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors rounded-lg hover:bg-stone-100"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Brand Trust Strip */}
        <div className="px-6 py-2.5 bg-stone-100/70 border-b border-stone-200 flex items-center justify-between text-[11px] text-stone-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8C7355]" />
            10-Year Frame Warranty
          </span>
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#8C7355]" />
            Free White-Glove In-Home Setup
          </span>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto">
          {!cart || cart.items.length === 0 ? (
            /* Luxury Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
              <div className="w-20 h-20 bg-[#FAF9F6] rounded-2xl border border-stone-200 flex items-center justify-center text-[#8C7355] mb-5 shadow-xs">
                <ShoppingBag className="w-9 h-9 stroke-1" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-[#171717] mb-2">Your Bag is Empty</h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed max-w-xs">
                Each piece in our atelier is handcrafted to commission from seasoned timber. Discover our signature suites and dining centerpieces.
              </p>

              {/* Discovery Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6 max-w-xs">
                <Link
                  href="/products?category=living-room"
                  onClick={closeCart}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-stone-100 hover:bg-[#8C7355] hover:text-white transition-colors"
                >
                  Living Room
                </Link>
                <Link
                  href="/products?category=dining"
                  onClick={closeCart}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-stone-100 hover:bg-[#8C7355] hover:text-white transition-colors"
                >
                  Dining Tables
                </Link>
                <Link
                  href="/products?category=bedroom"
                  onClick={closeCart}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-stone-100 hover:bg-[#8C7355] hover:text-white transition-colors"
                >
                  Bedroom Suites
                </Link>
                <Link
                  href="#design-consultation"
                  onClick={closeCart}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  Turnkey Interiors
                </Link>
              </div>

              <div className="flex flex-col gap-2.5 w-full max-w-xs">
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="w-full py-3 bg-[#171717] hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors text-center shadow-xs"
                >
                  Browse Full Catalog (90+ Pieces)
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 px-6">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-5 group">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 bg-[#FAF9F6] flex-shrink-0 rounded-xl overflow-hidden border border-stone-200">
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
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-col flex-1 min-w-0 justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-serif font-semibold text-[#171717] line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-stone-300 hover:text-red-500 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-stone-400 mt-0.5">SKU: {item.sku}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-stone-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                        <button
                          className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-black hover:bg-white transition-colors disabled:opacity-30"
                          onClick={() => updateItem(item.variantId, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-black hover:bg-white transition-colors"
                          onClick={() => updateItem(item.variantId, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
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
          <div className="border-t border-stone-200 bg-[#FAF9F6] px-6 py-5 space-y-4 shadow-lg">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Commission Subtotal</span>
                <span className="text-stone-900 font-medium">{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Artisan Savings</span>
                  <span>−{formatPrice(cart.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500">
                <span>White-Glove Delivery (Bengaluru)</span>
                <span className="text-emerald-800 font-medium">Complimentary</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-stone-200 text-[#171717]">
                <span className="font-serif">Estimated Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 text-center">
              Inclusive of GST · Moisture testing &amp; 10-Yr warranty included
            </p>

            <div className="space-y-2">
              <Link href="/checkout" onClick={closeCart} className="block">
                <button className="w-full py-3.5 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded-xl flex items-center justify-center gap-2 shadow-sm">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link href="/cart" onClick={closeCart} className="block">
                <button className="w-full py-2.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-medium rounded-xl transition-colors text-center">
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
