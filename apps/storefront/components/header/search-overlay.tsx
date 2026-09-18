'use client';

import { Search, X, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Solid Teak Sofas',
  'Dining Tables',
  'King Size Beds',
  'Lounge Armchairs',
  'Walk-in Wardrobes',
  'Bespoke TV Units',
];

const QUICK_COLLECTIONS = [
  { label: 'Living Room Atelier', href: '/products?category=living-room' },
  { label: 'Master Bedroom', href: '/products?category=bedroom' },
  { label: 'Dining Craftsmanship', href: '/products?category=dining' },
  { label: 'Bespoke Design Services', href: '/design-services' },
];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard accessibility: Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Full-Page Dimmed Scrim Backdrop (Click-outside dismissal) */}
      <div
        className="animate-in fade-in fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Luxury Search Overlay Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search National Furniture & Interiors"
        className="animate-in slide-in-from-top-2 absolute left-0 top-full z-50 w-full border-b border-[#E8E2D8] bg-[#FAF9F6] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] duration-200 dark:border-neutral-800 dark:bg-[#171717]"
      >
        <div className="container mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
          {/* Header Row */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C7355] dark:text-[#C5A059]">
                <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>Atelier Search</span>
              </div>
              <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#171717] sm:text-2xl dark:text-white">
                What can we craft for you?
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              aria-label="Close search"
            >
              <X strokeWidth={1.75} size={22} />
            </button>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search sofas, dining tables, teak joinery, collections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-b-2 border-[#D6CEC2] bg-transparent pb-3 pr-24 font-serif text-xl text-[#171717] transition-colors placeholder:text-neutral-400/80 focus:border-[#C5A059] focus:outline-none md:text-2xl dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500"
              />
              <div className="absolute bottom-2.5 right-0 flex items-center gap-2">
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    aria-label="Clear query"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-[#171717] px-4 text-xs font-semibold text-[#D4AF37] shadow-sm transition-all hover:bg-[#262626] dark:bg-[#C5A059] dark:text-[#171717] dark:hover:bg-[#d4af37]"
                  aria-label="Submit search"
                >
                  <Search strokeWidth={2} size={16} />
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Popular Searches & Quick Collections */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Popular Searches */}
            <div className="md:col-span-2">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8C7355] dark:text-neutral-400">
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      router.push(`/products?search=${encodeURIComponent(term)}`);
                      onClose();
                    }}
                    className="shadow-xs rounded-full border border-[#DCD5C9] bg-white px-3.5 py-1.5 text-xs font-medium text-[#4A3B32] transition-all hover:border-[#C5A059] hover:bg-[#FAF6F0] hover:text-[#171717] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-[#C5A059] dark:hover:text-white"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Collections */}
            <div className="border-t border-[#E8E2D8] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0 dark:border-neutral-800">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8C7355] dark:text-neutral-400">
                Curated Spaces
              </h3>
              <ul className="space-y-2">
                {QUICK_COLLECTIONS.map((col) => (
                  <li key={col.label}>
                    <button
                      type="button"
                      onClick={() => handleNavigate(col.href)}
                      className="group flex w-full items-center justify-between text-left text-xs font-medium text-[#4A3B32] transition-colors hover:text-[#171717] dark:text-neutral-300 dark:hover:text-[#C5A059]"
                    >
                      <span>{col.label}</span>
                      <ArrowRight className="h-3 w-3 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#C5A059]" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
