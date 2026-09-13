'use client';

import Link from 'next/link';
import { 
  Armchair, 
  Coffee, 
  Utensils, 
  Tv, 
  Bed, 
  Home, 
  Briefcase, 
  Sparkles, 
  Ruler 
} from 'lucide-react';

interface FurnitureMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const LIVING_DINING_ITEMS = [
  { label: 'Sofas & Sectionals', href: '/products?category=sofas', icon: Armchair },
  { label: 'Coffee & Center Tables', href: '/products?category=coffee-tables', icon: Coffee },
  { label: 'Solid Teak Dining Sets', href: '/products?category=dining-tables', icon: Utensils },
  { label: 'TV & Media Consoles', href: '/products?category=tv-units', icon: Tv },
];

const BEDROOM_STUDY_ITEMS = [
  { label: 'Heirloom Teak Beds', href: '/products?category=beds', icon: Bed },
  { label: 'Artisanal Wardrobes', href: '/products?category=wardrobes', icon: Home },
  { label: 'Executive Study Desks', href: '/products?category=desks', icon: Briefcase },
  { label: 'Lounge & Accent Chairs', href: '/products?category=lounge-chairs', icon: Sparkles },
];

export function FurnitureMegaMenu({ isOpen, onClose }: FurnitureMegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-full left-0 w-[420px] bg-white border border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.08)] mt-[1px] cursor-default animate-fade-in-up rounded-b-xl overflow-hidden z-50"
      style={{ animationDuration: '200ms' }}
    >
      <div className="p-6 space-y-6">
        {/* Living & Dining Column */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Living &amp; Dining Room
          </span>
          <ul className="space-y-2">
            {LIVING_DINING_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bedroom & Study Column */}
        <div className="pt-4 border-t border-gray-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Bedroom &amp; Executive Study
          </span>
          <ul className="space-y-2">
            {BEDROOM_STUDY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer CTAs */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <Link 
            href="/design-services#custom-furniture" 
            className="text-xs font-semibold text-stone-900 hover:text-[#8C7355] flex items-center gap-1.5 transition-colors"
            onClick={onClose}
          >
            <Ruler size={13} className="text-[#8C7355]" />
            <span>Bespoke Sizing</span>
          </Link>

          <Link 
            href="/products" 
            className="text-xs font-semibold text-[#8C7355] hover:opacity-80 flex items-center group transition-colors"
            onClick={onClose}
          >
            <span>View All Furniture</span>
            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

