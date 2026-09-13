'use client';

import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = ['Sofas', 'Dining Tables', 'Beds', 'Lounge Chairs'];

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  return (
    <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-[0_20px_40px_rgb(0,0,0,0.04)] animate-fade-in-up" style={{ animationDuration: '250ms' }}>
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900 tracking-tight">Search NFI</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X strokeWidth={1.5} size={24} />
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative mb-10">
          <input
            ref={inputRef}
            type="text"
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-2xl md:text-3xl text-gray-900 placeholder:text-gray-300 border-b border-gray-200 pb-4 focus:outline-none focus:border-gray-900 bg-transparent transition-colors"
          />
          <button type="submit" className="absolute right-0 bottom-4 text-gray-900 hover:opacity-70 transition-opacity">
            <Search strokeWidth={1.5} size={28} />
          </button>
        </form>

        <div>
          <h4 className="text-[11px] font-semibold text-gray-500 tracking-[0.1em] mb-4 uppercase">
            Popular searches
          </h4>
          <div className="flex flex-wrap gap-4">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  router.push(`/products?search=${encodeURIComponent(term)}`);
                  onClose();
                }}
                className="text-[14px] text-gray-600 hover:text-gray-900 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
