'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface CompactCategoryItem {
  name: string;
  slug: string;
  image: string;
  count: number;
}

interface CompactCategoryCardProps {
  item: CompactCategoryItem;
  priority?: boolean;
}

export function CompactCategoryCard({ item, priority = false }: CompactCategoryCardProps) {
  return (
    <Link
      href={`/products?category=${item.slug}`}
      className="group relative block w-full overflow-hidden rounded-md border border-[#E5E0D8] bg-[#FAF9F6] shadow-2xs transition-all duration-300 hover:border-[#8C7355] hover:shadow-md"
    >
      {/* Aspect 4:3 Compact Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Gradient Overlay for WCAG AA Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

        {/* Top Badge: Piece count */}
        <div className="absolute top-2 right-2">
          <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow-xs backdrop-blur-xs">
            {item.count}+ pieces
          </span>
        </div>

        {/* Bottom Content: Room Title & Arrow */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-serif font-medium text-white tracking-wide transition-colors group-hover:text-amber-200">
              {item.name}
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-gray-300 mt-0.5">
              Explore Room
            </p>
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-[#8C7355]">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
