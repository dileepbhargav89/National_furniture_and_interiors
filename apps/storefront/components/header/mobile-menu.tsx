'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, Sparkles, Phone, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';
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
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel — Slides in from Left */}
      <div 
        className="relative w-[85%] max-w-[380px] h-full bg-[#FAF9F6] shadow-2xl flex flex-col animate-slide-in-left overflow-y-auto border-r border-[#EAE7E1]"
        style={{ animationDuration: '300ms' }}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 bg-white">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-[#E07020] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              NFI
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#171717] block leading-none">
                National Interiors
              </span>
              <span className="text-[10px] text-[#8C7355] font-medium tracking-wide">
                Est. 1998 · Bengaluru
              </span>
            </div>
          </Link>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-900 transition-colors p-2 rounded-lg hover:bg-stone-100"
            aria-label="Close menu"
          >
            <X strokeWidth={1.5} size={22} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
          {/* Main Navigation with Expandable Subsections */}
          <nav className="flex flex-col gap-1">
            {/* Furniture Dropdown Accordion */}
            <div className="border-b border-stone-200/80 pb-3">
              <div className="flex items-center justify-between py-2">
                <Link
                  href="/products"
                  className="text-xl font-serif text-[#171717] tracking-tight hover:text-[#8C7355] transition-colors"
                  onClick={onClose}
                >
                  Furniture
                </Link>
                <button
                  type="button"
                  onClick={() => setFurnitureOpen(!furnitureOpen)}
                  className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label="Toggle furniture categories"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${furnitureOpen ? 'rotate-180 text-[#8C7355]' : ''}`}
                  />
                </button>
              </div>

              {furnitureOpen && (
                <div className="pl-3 pt-2 pb-1 space-y-2 border-l-2 border-[#8C7355]/40 ml-1 mt-1 text-xs">
                  <Link
                    href="/products?category=living-room"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
                    onClick={onClose}
                  >
                    Living &amp; Modular Sofas
                  </Link>
                  <Link
                    href="/products?category=dining"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
                    onClick={onClose}
                  >
                    Sculptural Dining Tables
                  </Link>
                  <Link
                    href="/products?category=bedroom"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
                    onClick={onClose}
                  >
                    Teakwood Bedroom Suites
                  </Link>
                  <Link
                    href="/products?category=office"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
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
                  className="text-xl font-serif text-[#171717] tracking-tight hover:text-[#8C7355] transition-colors"
                  onClick={onClose}
                >
                  Design Services
                </Link>
                <button
                  type="button"
                  onClick={() => setDesignOpen(!designOpen)}
                  className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  aria-label="Toggle design services"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${designOpen ? 'rotate-180 text-[#8C7355]' : ''}`}
                  />
                </button>
              </div>

              {designOpen && (
                <div className="pl-3 pt-2 pb-1 space-y-2 border-l-2 border-[#8C7355]/40 ml-1 mt-1 text-xs">
                  <Link
                    href="/design-services#residential"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
                    onClick={onClose}
                  >
                    Turnkey Residential Villas &amp; Apts
                  </Link>
                  <Link
                    href="/design-services#commercial"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors"
                    onClick={onClose}
                  >
                    Commercial, Hospitality &amp; Retail
                  </Link>
                  <Link
                    href="/design-services#cost-estimator"
                    className="block py-1.5 text-stone-700 hover:text-[#8C7355] transition-colors font-medium text-[#E07020]"
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
              className="text-xl font-serif text-[#171717] tracking-tight py-3 border-b border-stone-200/80 hover:text-[#8C7355] transition-colors"
              onClick={onClose}
            >
              Collections
            </Link>
            <Link
              href="/our-story"
              className="text-xl font-serif text-[#171717] tracking-tight py-3 border-b border-stone-200/80 hover:text-[#8C7355] transition-colors"
              onClick={onClose}
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              className="text-xl font-serif text-[#171717] tracking-tight py-3 hover:text-[#8C7355] transition-colors"
              onClick={onClose}
            >
              Experience Studios
            </Link>
          </nav>

          {/* Primary CTA: Consultation */}
          <Link href="/contact" onClick={onClose} className="block mt-2">
            <button className="w-full py-3.5 bg-[#171717] text-white text-xs font-semibold tracking-wider uppercase hover:bg-[#8C7355] transition-colors rounded-xl flex items-center justify-center gap-2 shadow-sm">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <span>Book 3D Consultation</span>
            </button>
          </Link>

          {/* User & Order Shortcuts */}
          <div className="bg-white rounded-xl border border-stone-200 p-3.5 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7355] block mb-1">
              Patron Services
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Link
                href="/profile"
                className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-800 transition-colors"
                onClick={onClose}
              >
                Account
              </Link>
              <Link
                href="/wishlist"
                className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-800 transition-colors"
                onClick={onClose}
              >
                Wishlist
              </Link>
              <Link
                href="/cart"
                className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-800 transition-colors"
                onClick={onClose}
              >
                Cart
              </Link>
            </div>
          </div>

          {/* Direct Concierge Contact Buttons */}
          <div className="pt-2 border-t border-stone-200/80 space-y-2.5 pb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Direct Workshop Concierge
            </span>
            <a
              href="https://wa.me/919663628302?text=Hello%20National%20Furniture%20%26%20Interiors%20Concierge"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200"
            >
              <MessageSquare size={15} className="text-emerald-600" />
              <span>WhatsApp Concierge (+91 96636 28302)</span>
            </a>
            <a
              href="tel:+919663628302"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-800 text-xs font-medium"
            >
              <Phone size={15} className="text-stone-600" />
              <span>Call Flagship Studio</span>
            </a>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 pt-1">
              <ShieldCheck size={14} className="text-[#8C7355]" />
              <span>10-Yr Warranty · Free White-Glove Handover</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
