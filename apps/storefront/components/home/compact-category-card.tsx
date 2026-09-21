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
      className="luxury-card-hover group relative block w-full overflow-hidden rounded-md border border-[#E5E0D8] bg-[#FAF9F6]"
    >
      {/* Aspect 4:3 Compact Stage */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          className="luxury-img-zoom object-cover"
        />

        {/* Gradient Overlay for WCAG AA Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

        {/* Top Badge: Piece count */}
        <div className="absolute right-2 top-2 transition-transform duration-300 group-hover:-translate-y-0.5">
          <span className="rounded-full border border-black/5 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow-sm backdrop-blur-md">
            {item.count}+ pieces
          </span>
        </div>

        {/* Bottom Content: Room Title & Arrow */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
          <div>
            <h3 className="font-serif text-xs font-medium tracking-wide text-white transition-colors duration-300 group-hover:text-amber-200 sm:text-sm">
              {item.name}
            </h3>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-300 transition-colors duration-300 group-hover:text-white">
              Explore Room
            </p>
          </div>

          <div className="backdrop-blur-xs flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:bg-[#E07020]">
            <svg
              className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
