'use client';

import Link from 'next/link';
import { Home, Building2, Utensils, Hotel, ShoppingBag, Compass, Calculator, Ruler } from 'lucide-react';

interface DesignServicesMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const RESIDENTIAL_SERVICES = [
  { label: 'Turnkey Home Interiors', href: '/design-services#turnkey', icon: Home },
  { label: 'Space Planning & 3D VR', href: '/design-services#space-planning', icon: Compass },
  { label: 'Bespoke Teak Furniture', href: '/design-services#custom-furniture', icon: Ruler },
];

const COMMERCIAL_SERVICES = [
  { label: 'Restaurants & Cafés', href: '/design-services#restaurant-design', icon: Utensils },
  { label: 'Hotels & Hospitality', href: '/design-services#hotel-hospitality', icon: Hotel },
  { label: 'Offices & Workspaces', href: '/design-services#commercial-office', icon: Building2 },
  { label: 'Retail Shops & Showrooms', href: '/design-services#retail-design', icon: ShoppingBag },
];

export function DesignServicesMenu({ isOpen, onClose }: DesignServicesMenuProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-full left-0 w-[380px] bg-white border border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.08)] mt-[1px] cursor-default animate-fade-in-up rounded-b-xl overflow-hidden z-50"
      style={{ animationDuration: '200ms' }}
    >
      <div className="p-6 space-y-6">
        {/* Residential Column */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Residential Architecture
          </span>
          <ul className="space-y-2">
            {RESIDENTIAL_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{s.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Commercial & Hospitality Column */}
        <div className="pt-4 border-t border-gray-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Commercial &amp; Hospitality
          </span>
          <ul className="space-y-2">
            {COMMERCIAL_SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.label}>
                  <Link
                    href={s.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{s.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer CTAs */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <Link 
            href="/design-services#cost-estimator" 
            className="text-xs font-semibold text-stone-900 hover:text-[#8C7355] flex items-center gap-1.5 transition-colors"
            onClick={onClose}
          >
            <Calculator size={13} className="text-[#8C7355]" />
            <span>Cost Estimator</span>
          </Link>

          <Link 
            href="/design-services" 
            className="text-xs font-semibold text-[#8C7355] hover:opacity-80 flex items-center group transition-colors"
            onClick={onClose}
          >
            <span>Explore All</span>
            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
