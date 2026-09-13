'use client';

import Link from 'next/link';
import { 
  Crown, 
  Sparkles, 
  Home, 
  Layers, 
  Building2, 
  Briefcase, 
  Sun, 
  Trees, 
  BookOpen 
} from 'lucide-react';

interface CollectionsMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIGNATURE_COLLECTIONS = [
  { label: 'The Imperial Teakwood Suite', href: '/collections/the-imperial-teak', icon: Crown },
  { label: 'Milano Noir Executive Edit', href: '/collections/milano-noir', icon: Sparkles },
  { label: 'Mid-Century Modern Living', href: '/collections/mid-century-modern-living', icon: Home },
  { label: 'Scandinavian Minimalism', href: '/collections/scandinavian-minimalism', icon: Layers },
];

const ARCHITECTURAL_COLLECTIONS = [
  { label: 'Industrial Penthouse Loft', href: '/collections/industrial-loft', icon: Building2 },
  { label: 'Contemporary Executive Office', href: '/collections/contemporary-office', icon: Briefcase },
  { label: 'Bohemian Artisan Sanctuary', href: '/collections/bohemian-oasis', icon: Sun },
  { label: 'Outdoor Courtyard & Patio', href: '/collections/outdoor-sanctuary', icon: Trees },
];

export function CollectionsMegaMenu({ isOpen, onClose }: CollectionsMegaMenuProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-full left-0 w-[380px] bg-white border border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.08)] mt-[1px] cursor-default animate-fade-in-up rounded-b-xl overflow-hidden z-50"
      style={{ animationDuration: '200ms' }}
    >
      <div className="p-6 space-y-6">
        {/* Signature Edits Column */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Signature Heirloom Edits
          </span>
          <ul className="space-y-2">
            {SIGNATURE_COLLECTIONS.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{c.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Architectural Edits Column */}
        <div className="pt-4 border-t border-gray-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7355] block mb-2.5">
            Architectural Concepts
          </span>
          <ul className="space-y-2">
            {ARCHITECTURAL_COLLECTIONS.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    className="text-[13.5px] text-gray-800 hover:text-[#8C7355] transition-colors flex items-center gap-2.5 py-1 group"
                    onClick={onClose}
                  >
                    <Icon size={14} className="text-stone-400 group-hover:text-[#8C7355] transition-colors shrink-0" />
                    <span>{c.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer CTAs */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <Link 
            href="/collections" 
            className="text-xs font-semibold text-stone-900 hover:text-[#8C7355] flex items-center gap-1.5 transition-colors"
            onClick={onClose}
          >
            <BookOpen size={13} className="text-[#8C7355]" />
            <span>Lookbook 2026</span>
          </Link>

          <Link 
            href="/collections" 
            className="text-xs font-semibold text-[#8C7355] hover:opacity-80 flex items-center group transition-colors"
            onClick={onClose}
          >
            <span>View All Collections</span>
            <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

