'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CatalogService, type Category } from '@nfi/api-client';

const FALLBACK_CATEGORIES = [
  {
    id: 'cat-living',
    slug: 'living-room',
    name: 'Living Room Atelier',
    description: 'Sculptural sofas, organic teak coffee tables, and low-slung bouclé lounges crafted for refined Bangalore entertaining.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop',
    itemCount: '28 Masterpieces',
  },
  {
    id: 'cat-dining',
    slug: 'dining-room',
    name: 'Dining & Entertaining',
    description: 'Solid book-matched Burma teak dining tables, fluted credenzas, and handcrafted cantilever chairs.',
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?q=80&w=1200&auto=format&fit=crop',
    itemCount: '19 Masterpieces',
  },
  {
    id: 'cat-bedroom',
    slug: 'bedroom',
    name: 'Bedroom Sanctuaries',
    description: 'Floating platform bed frames, integrated acoustic headboards, and bedside tables with brass hardware.',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?q=80&w=1200&auto=format&fit=crop',
    itemCount: '22 Masterpieces',
  },
  {
    id: 'cat-study',
    slug: 'study-office',
    name: 'Executive Study & Library',
    description: 'Solid walnut desks with full-grain leather inlays, fluted acoustic library shelving, and bespoke executive armchairs.',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop',
    itemCount: '15 Masterpieces',
  },
  {
    id: 'cat-storage',
    slug: 'entryway-storage',
    name: 'Entryway & Architectural Millwork',
    description: 'Handcrafted Sheesham shoe credenzas, concealed wardrobes, and fluted consoles tailored for private residences.',
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1200&auto=format&fit=crop',
    itemCount: '17 Masterpieces',
  },
  {
    id: 'cat-outdoor',
    slug: 'outdoor-terrace',
    name: 'Outdoor & Sky Terraces',
    description: 'Weather-resilient seasoned teak loungers, stone cocktail tables, and hand-woven performance cord chairs.',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
    itemCount: '12 Masterpieces',
  },
];

interface CategoryDisplayItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  itemCount: string;
}

export default function CategoriesDirectoryPage() {
  const [categories, setCategories] = useState<CategoryDisplayItem[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await CatalogService.listCategories();
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        if (items.length > 0) {
          // Merge API categories with rich image fallbacks
          const merged: CategoryDisplayItem[] = items.map((cat: Category, idx: number) => {
            const fallback = FALLBACK_CATEGORIES[idx % FALLBACK_CATEGORIES.length];
            return {
              id: cat.id || (cat as { _id?: string })._id || `cat-${idx}`,
              slug: cat.slug,
              name: cat.name,
              description: cat.description || fallback?.description || '',
              image: (cat as { image?: string }).image || fallback?.image || '',
              itemCount: fallback?.itemCount || 'Curated Edition',
            };
          });
          setCategories(merged);
        }
      } catch (e) {
        console.error('Error fetching categories, using curated aesthetic defaults', e);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#171717]">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-b from-[#FAF9F6] to-white border-b border-stone-200/60 pt-16 pb-14 text-center">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#C5A059] font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            CURATED SPATIAL DISCIPLINES
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-[#171717] tracking-tight mb-4">
            Masterpiece Categories
          </h1>

          <p className="text-stone-600 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            Explore our curated furniture portfolios by living domain. Every piece is engineered with seasoned hardwoods, precision joinery, and organic hand-buffed finishes.
          </p>
        </div>
      </section>

      {/* 2. Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-stone-200/80 hover:border-[#C5A059]/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <span className="absolute top-3 right-3 bg-[#171717]/85 backdrop-blur-sm text-white text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 rounded-sm">
                      {cat.itemCount}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-serif font-medium text-[#171717] group-hover:text-[#C5A059] transition-colors leading-snug mb-2">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-stone-500 font-light leading-relaxed line-clamp-3">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-[#171717]">
                  <span className="text-stone-400 font-light group-hover:text-stone-600 transition-colors">
                    View Discipline
                  </span>
                  <span className="text-[#C5A059] group-hover:translate-x-1 transition-transform">
                    Explore Collection →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Turnkey Spatial Guidance Banner */}
      <section className="py-14 bg-stone-50 border-t border-stone-200">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl text-center">
          <span className="text-xs uppercase tracking-widest text-[#C5A059] font-medium block mb-2">
            Bespoke Residential Commissioning
          </span>
          <h2 className="text-2xl md:text-3xl font-serif font-light text-[#171717] mb-3">
            Require a Custom Suite or Tailored Dimensions?
          </h2>
          <p className="text-xs md:text-sm text-stone-500 font-light max-w-xl mx-auto mb-6 leading-relaxed">
            Our atelier crafts custom-dimensioned furniture and full-home millwork tailored to your architectural plans.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/design-services"
              className="px-6 py-3 bg-[#171717] hover:bg-[#C5A059] text-white text-xs uppercase tracking-widest font-medium rounded-md transition-colors shadow-md"
            >
              Consult an Architect
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 bg-white hover:bg-stone-100 text-[#171717] text-xs uppercase tracking-widest font-medium rounded-md border border-stone-300 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
