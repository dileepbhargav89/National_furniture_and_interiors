'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Sparkles,
  Phone,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [furnitureOpen, setFurnitureOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        className="backdrop-blur-xs absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel — Slides in from Left */}
      <div
        className="animate-slide-in-left relative flex h-full w-[85%] max-w-[380px] flex-col overflow-y-auto border-r border-[#EAE7E1] bg-[#FAF9F6] shadow-2xl"
        style={{ animationDuration: '300ms' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white p-5">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="shadow-xs flex h-8 w-8 items-center justify-center rounded-lg bg-[#E07020] text-xs font-bold text-white">
              NFI
            </div>
            <div>
              <span className="block text-sm font-bold leading-none tracking-tight text-[#171717]">
                National Interiors
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[#8C7355]">
                Est. 1998 · Bengaluru
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
            aria-label="Close menu"
          >
            <X strokeWidth={1.5} size={22} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
          {/* Main Navigation with Expandable Subsections */}
          <nav className="flex flex-col gap-1">
            {/* Furniture Dropdown Accordion */}
            <div className="border-b border-stone-200/80 pb-3">
              <div className="flex items-center justify-between py-2">
                <Link
                  href="/products"
                  className="font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
                  onClick={onClose}
                >
                  Furniture
                </Link>
                <button
                  type="button"
                  onClick={() => setFurnitureOpen(!furnitureOpen)}
                  className="p-2 text-stone-400 transition-colors hover:text-stone-900"
                  aria-label="Toggle furniture categories"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${furnitureOpen ? 'rotate-180 text-[#8C7355]' : ''}`}
                  />
                </button>
              </div>

              {furnitureOpen && (
                <div className="ml-1 mt-1 space-y-2 border-l-2 border-[#8C7355]/40 pb-1 pl-3 pt-2 text-xs">
                  <Link
                    href="/products?category=living-room"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Living &amp; Modular Sofas
                  </Link>
                  <Link
                    href="/products?category=dining"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Sculptural Dining Tables
                  </Link>
                  <Link
                    href="/products?category=bedroom"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Teakwood Bedroom Suites
                  </Link>
                  <Link
                    href="/products?category=office"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Executive Study &amp; Desks
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-1 py-1.5 font-semibold text-[#8C7355] hover:underline"
                    onClick={onClose}
                  >
                    <span>View All 90+ Pieces</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>

            {/* Design Services Accordion */}
            <div className="border-b border-stone-200/80 pb-3 pt-2">
              <div className="flex items-center justify-between py-2">
                <Link
                  href="/design-services"
                  className="font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
                  onClick={onClose}
                >
                  Design Services
                </Link>
                <button
                  type="button"
                  onClick={() => setDesignOpen(!designOpen)}
                  className="p-2 text-stone-400 transition-colors hover:text-stone-900"
                  aria-label="Toggle design services"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${designOpen ? 'rotate-180 text-[#8C7355]' : ''}`}
                  />
                </button>
              </div>

              {designOpen && (
                <div className="ml-1 mt-1 space-y-2 border-l-2 border-[#8C7355]/40 pb-1 pl-3 pt-2 text-xs">
                  <Link
                    href="/design-services#residential"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Turnkey Residential Villas &amp; Apts
                  </Link>
                  <Link
                    href="/design-services#commercial"
                    className="block py-1.5 text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Commercial, Hospitality &amp; Retail
                  </Link>
                  <Link
                    href="/design-services#cost-estimator"
                    className="block py-1.5 font-medium text-[#E07020] text-stone-700 transition-colors hover:text-[#8C7355]"
                    onClick={onClose}
                  >
                    Bangalore Cost Estimator ➔
                  </Link>
                </div>
              )}
            </div>

            {/* Standard Links */}
            <Link
              href="/collections"
              className="border-b border-stone-200/80 py-3 font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
              onClick={onClose}
            >
              Collections
            </Link>
            <Link
              href="/blogs"
              className="border-b border-stone-200/80 py-3 font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
              onClick={onClose}
            >
              Journal
            </Link>
            <Link
              href="/our-story"
              className="border-b border-stone-200/80 py-3 font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
              onClick={onClose}
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              className="py-3 font-serif text-xl tracking-tight text-[#171717] transition-colors hover:text-[#8C7355]"
              onClick={onClose}
            >
              Experience Studios
            </Link>
          </nav>

          {/* Primary CTA: Consultation */}
          <Link href="/contact" onClick={onClose} className="mt-2 block">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-[#8C7355]">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span>Book 3D Consultation</span>
            </button>
          </Link>

          {/* User & Order Shortcuts */}
          <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3.5 text-xs">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#8C7355]">
              Patron Services
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Link
                href="/profile"
                className="rounded-lg bg-stone-50 p-2 text-stone-800 transition-colors hover:bg-stone-100"
                onClick={onClose}
              >
                Account
              </Link>
              <Link
                href="/wishlist"
                className="rounded-lg bg-stone-50 p-2 text-stone-800 transition-colors hover:bg-stone-100"
                onClick={onClose}
              >
                Wishlist
              </Link>
              <Link
                href="/cart"
                className="rounded-lg bg-stone-50 p-2 text-stone-800 transition-colors hover:bg-stone-100"
                onClick={onClose}
              >
                Cart
              </Link>
            </div>
          </div>

          {/* Direct Concierge Contact Buttons */}
          <div className="space-y-2.5 border-t border-stone-200/80 pb-6 pt-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Direct Workshop Concierge
            </span>
            <a
              href="https://wa.me/919663628302?text=Hello%20National%20Furniture%20%26%20Interiors%20Concierge"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>WhatsApp Concierge (+91 96636 28302)</span>
            </a>
            <a
              href="tel:+919663628302"
              className="flex items-center gap-2.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-medium text-stone-800"
            >
              <Phone size={15} className="text-stone-600" />
              <span>Call Flagship Studio</span>
            </a>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-stone-500">
              <ShieldCheck size={14} className="text-[#8C7355]" />
              <span>10-Yr Warranty · Free White-Glove Handover</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
