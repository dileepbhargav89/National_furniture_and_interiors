'use client';

import React, { useState, useEffect, useMemo, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CatalogService, ProductCollection } from '@nfi/api-client';
import {
  CURATED_COLLECTIONS_DATA,
  ROOM_CATEGORIES,
  AESTHETIC_STYLES,
  type CollectionEnrichment,
} from '../../data/curated-collections';
import {
  Sparkles,
  ShieldCheck,
  Clock,
  Truck,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Compass,
  Layers,
  Building2,
  Calendar,
} from 'lucide-react';

interface EnrichedCollection extends Omit<Partial<ProductCollection>, 'heroImage'> {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  heroImage?: { url: string; altText?: string } | ProductCollection['heroImage'];
  enrichment: CollectionEnrichment;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<EnrichedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState('all');
  const [activeStyle, setActiveStyle] = useState('All Styles');
  const [searchQuery, setSearchQuery] = useState('');

  const searchInputId = useId();
  const styleSelectId = useId();

  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true);
        const response = await CatalogService.listCollections();
        const rawItems = response.data || [];
        const items = Array.isArray(rawItems) ? rawItems : [];

        // If backend has items, enrich them with Bengaluru design specifications
        if (items.length > 0) {
          const enriched: EnrichedCollection[] = items.map((col) => {
            const fallback = CURATED_COLLECTIONS_DATA[col.slug] || {
              slug: col.slug,
              title: col.title,
              roomType: 'living',
              roomLabel: 'Curated Suite',
              style: 'Contemporary',
              curatedBadge: 'Architect Curated',
              startingPrice: 85000,
              emiMonthly: 3999,
              pieceCount: col.productIds?.length || 6,
              materials: ['Solid Teak Wood', 'Century Marine Plywood', 'Belgian Fabric'],
              bundleDiscountPercent: 12,
              popularInSocieties: ['Prestige Lakeside Habitat', 'Sobha Dream Acres'],
              heroImage: col.heroImage?.url || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
              designerQuote: 'Curated architectural proportions and premium finishes built for modern Bengaluru living.',
            };

            return {
              ...col,
              id: col.id || col.slug,
              title: col.title || fallback.title,
              slug: col.slug,
              shortDescription: col.shortDescription || fallback.designerQuote,
              heroImage: col.heroImage?.url
                ? col.heroImage
                : { url: fallback.heroImage, altText: col.title },
              enrichment: fallback,
            };
          });
          setCollections(enriched);
        } else {
          // Resilient fallback to Bengaluru Curated Suite if API returns empty
          const staticEnriched: EnrichedCollection[] = Object.values(CURATED_COLLECTIONS_DATA).map((enr) => ({
            id: enr.slug,
            title: enr.title,
            slug: enr.slug,
            shortDescription: enr.designerQuote,
            heroImage: { url: enr.heroImage, altText: enr.title },
            enrichment: enr,
          }));
          setCollections(staticEnriched);
        }
      } catch (err) {
        console.error('Failed to fetch collections, activating curated fallback:', err);
        const staticEnriched: EnrichedCollection[] = Object.values(CURATED_COLLECTIONS_DATA).map((enr) => ({
          id: enr.slug,
          title: enr.title,
          slug: enr.slug,
          shortDescription: enr.designerQuote,
          heroImage: { url: enr.heroImage, altText: enr.title },
          enrichment: enr,
        }));
        setCollections(staticEnriched);
      } finally {
        setLoading(false);
      }
    }

    loadCollections();
  }, []);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const enr = col.enrichment;
      // Room category filter
      if (activeRoom !== 'all' && enr.roomType !== activeRoom) return false;

      // Style filter
      if (activeStyle !== 'All Styles' && enr.style !== activeStyle) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = col.title.toLowerCase().includes(q);
        const matchesStyle = enr.style.toLowerCase().includes(q);
        const matchesMaterial = enr.materials.some((m) => m.toLowerCase().includes(q));
        const matchesSociety = enr.popularInSocieties.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesStyle && !matchesMaterial && !matchesSociety) return false;
      }

      return true;
    });
  }, [collections, activeRoom, activeStyle, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 selection:bg-[#8C7355] selection:text-white">
      {/* ── 1. ARCHITECTURAL LUXURY HERO HEADER ──────────────────────────── */}
      <section className="relative overflow-hidden bg-[#171717] text-white pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8C7355_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase mb-6 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              Bengaluru Architectural Suites · 2026 Collection
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] mb-6 text-white">
              Curated Living Collections
            </h1>
            <p className="text-neutral-300 text-base md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-10">
              Harmonized furniture suites designed by our Bengaluru interior architects. Handcrafted in solid Burma teak, seasoned sheesham, and European linen — sized for modern Indian layouts.
            </p>

            {/* Quick Trust Highlights Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-white/10 text-left">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">45-Day Delivery</p>
                  <p className="text-xs text-white font-semibold">With SLA Guarantee</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">10-Year Warranty</p>
                  <p className="text-xs text-white font-semibold">BWP Marine Grade</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">100% Solid Wood</p>
                  <p className="text-xs text-white font-semibold">Seasoned Teakwood</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <p className="text-xs text-neutral-400 font-medium">Bengaluru Setup</p>
                  <p className="text-xs text-white font-semibold">Free White-Glove</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INTERACTIVE FILTER & SEARCH TOOLBAR ──────────────────────── */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm transition-all">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Room Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {ROOM_CATEGORIES.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeRoom === room.id
                      ? 'bg-[#171717] text-white shadow-sm'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                  }`}
                >
                  {room.label}
                </button>
              ))}
            </div>

            {/* Controls: Search and Style Filter */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <label htmlFor={searchInputId} className="sr-only">Search collections</label>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Search collections or materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs md:text-sm focus:outline-none focus:border-[#8C7355] focus:ring-1 focus:ring-[#8C7355] text-neutral-900"
                />
              </div>

              {/* Style Dropdown */}
              <div className="relative">
                <label htmlFor={styleSelectId} className="sr-only">Filter by aesthetic style</label>
                <select
                  id={styleSelectId}
                  value={activeStyle}
                  onChange={(e) => setActiveStyle(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs md:text-sm font-medium text-neutral-800 focus:outline-none focus:border-[#8C7355] cursor-pointer"
                >
                  {AESTHETIC_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CURATED COLLECTIONS GRID ─────────────────────────────────── */}
      <section className="container mx-auto px-4 md:px-8 py-14">
        {/* Results Counter & Filter Feedback */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-neutral-200">
          <p className="text-xs md:text-sm text-neutral-500 font-medium">
            Showing <span className="font-semibold text-neutral-900">{filteredCollections.length}</span> curated design suites
            {activeRoom !== 'all' && (
              <span> in <strong className="text-neutral-900">{ROOM_CATEGORIES.find((r) => r.id === activeRoom)?.label}</strong></span>
            )}
            {activeStyle !== 'All Styles' && (
              <span> · <strong className="text-neutral-900">{activeStyle}</strong></span>
            )}
          </p>
          {(activeRoom !== 'all' || activeStyle !== 'All Styles' || searchQuery) && (
            <button
              onClick={() => {
                setActiveRoom('all');
                setActiveStyle('All Styles');
                setSearchQuery('');
              }}
              className="text-xs text-[#8C7355] hover:text-[#705c43] font-semibold underline underline-offset-4"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-[16/10] bg-neutral-200 w-full"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-neutral-200 w-1/3 rounded"></div>
                  <div className="h-6 bg-neutral-200 w-3/4 rounded"></div>
                  <div className="h-3 bg-neutral-200 w-full rounded"></div>
                  <div className="h-10 bg-neutral-200 w-full rounded-lg mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCollections.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 bg-white border border-dashed border-neutral-300 rounded-2xl p-8 max-w-xl mx-auto">
            <Compass className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="font-serif text-2xl font-light text-neutral-900 mb-2">No matching collections found</h3>
            <p className="text-neutral-500 text-sm mb-6">
              We couldn’t find any suites matching your filter criteria. Try resetting your search or room filter.
            </p>
            <button
              onClick={() => {
                setActiveRoom('all');
                setActiveStyle('All Styles');
                setSearchQuery('');
              }}
              className="px-6 py-2.5 bg-[#171717] text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              View All Collections
            </button>
          </div>
        ) : (
          /* Rich High-Density Collection Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCollections.map((col, index) => {
              const enr = col.enrichment;
              const imgUrl = col.heroImage?.url || enr.heroImage;

              return (
                <div
                  key={col.id}
                  className="group bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#8C7355]/40 transition-all duration-300 flex flex-col"
                >
                  {/* Card Visual Header */}
                  <Link href={`/collections/${col.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-neutral-900">
                    <Image
                      src={imgUrl}
                      alt={col.title}
                      fill
                      priority={index < 2}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    {/* Top Floating Badges */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 text-neutral-900 text-[11px] font-semibold tracking-wide shadow-sm backdrop-blur-md">
                        {enr.curatedBadge}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-[#D4AF37] text-[11px] font-semibold backdrop-blur-md">
                        {enr.pieceCount} Coordinated Pieces
                      </span>
                    </div>

                    {/* Bottom Image Overlay Details */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-300 mb-1">
                        <span>{enr.roomLabel}</span>
                        <span>•</span>
                        <span>{enr.style}</span>
                      </div>
                      <h2 className="font-serif text-xl sm:text-2xl font-light leading-tight text-white group-hover:text-[#D4AF37] transition-colors">
                        {col.title}
                      </h2>
                    </div>
                  </Link>

                  {/* Card Body Information */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Short Description / Designer Philosophy */}
                      <p className="text-neutral-600 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
                        {col.shortDescription || enr.designerQuote}
                      </p>

                      {/* Material Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {enr.materials.map((mat, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[10px] font-medium"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>

                      {/* Popular In Bangalore Communities */}
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mb-4 bg-amber-50/70 border border-amber-100/60 p-2 rounded-lg">
                        <Building2 className="w-3.5 h-3.5 text-[#8C7355] shrink-0" />
                        <span className="truncate">
                          Favored in: <strong className="text-neutral-800">{enr.popularInSocieties.join(', ')}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Pricing, Discount & Action Footer */}
                    <div className="pt-4 border-t border-neutral-100 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                            Full Suite Package
                          </p>
                          <p className="font-serif text-lg font-semibold text-neutral-900 flex items-center">
                            <span>₹{enr.startingPrice.toLocaleString('en-IN')}</span>
                            <span className="text-[11px] font-normal text-neutral-500 ml-1.5">onwards</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded border border-emerald-200">
                            Save {enr.bundleDiscountPercent}% Bundle
                          </span>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            EMI from ₹{enr.emiMonthly.toLocaleString('en-IN')}/mo
                          </p>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/collections/${col.slug}`}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold tracking-wide transition-all shadow-sm group-hover:shadow"
                        >
                          <span>Explore Suite</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href="/design-services#lead-form"
                          className="flex items-center justify-center py-2.5 px-3 rounded-lg border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-medium transition-colors"
                        >
                          Book Styling
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. "SHOP THE LOOK" SPOTLIGHT SHOWCASE ────────────────────────── */}
      <section className="bg-white py-20 border-y border-neutral-200">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
              Bengaluru Apartment Inspiration
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-neutral-900 mt-2 mb-4">
              Shop The Look: The Indiranagar Penthouse Suite
            </h2>
            <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
              Experience how our Mid-Century and Scandinavian pieces integrate seamlessly into double-height living spaces. Every piece is precision-crafted at our 40,000 sq.ft Bengaluru manufacturing facility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Ambiance */}
            <div className="lg:col-span-7 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-neutral-200">
              <Image
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop"
                alt="Penthouse Living Room Suite"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Installed at Kingfisher Towers
              </div>
            </div>

            {/* Curated Pieces in this Setup */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-serif text-xl font-medium text-neutral-900 mb-2">
                Featured in this Room Setup
              </h3>

              <div className="p-3.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-neutral-200 relative overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=200&auto=format&fit=crop"
                    alt="Solid Teak Sofa"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate">Venezia 3-Seater Teak Sofa</h4>
                  <p className="text-xs text-neutral-500">Solid Teakwood · Belgian Bouclé</p>
                  <p className="text-xs font-semibold text-neutral-900 mt-0.5">₹48,500</p>
                </div>
                <Link
                  href="/products"
                  className="text-xs text-[#8C7355] font-semibold hover:underline shrink-0"
                >
                  View Piece
                </Link>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-neutral-200 relative overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=200&auto=format&fit=crop"
                    alt="Marble Top Coffee Table"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate">Aura Marble Fluted Coffee Table</h4>
                  <p className="text-xs text-neutral-500">Italian Marble · Brass Accent</p>
                  <p className="text-xs font-semibold text-neutral-900 mt-0.5">₹24,900</p>
                </div>
                <Link
                  href="/products"
                  className="text-xs text-[#8C7355] font-semibold hover:underline shrink-0"
                >
                  View Piece
                </Link>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-neutral-200 relative overflow-hidden shrink-0">
                  <Image
                    src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=200&auto=format&fit=crop"
                    alt="Media Console"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-neutral-900 truncate">Koben Teak Media Credenza</h4>
                  <p className="text-xs text-neutral-500">Century 710 Plywood · Fluted Slats</p>
                  <p className="text-xs font-semibold text-neutral-900 mt-0.5">₹34,000</p>
                </div>
                <Link
                  href="/products"
                  className="text-xs text-[#8C7355] font-semibold hover:underline shrink-0"
                >
                  View Piece
                </Link>
              </div>

              <div className="pt-2">
                <Link
                  href="/collections/mid-century-modern-living"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#171717] hover:bg-[#8C7355] text-white text-xs md:text-sm font-semibold transition-colors"
                >
                  <span>Shop Entire Penthouse Suite (Save ₹12,800)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CUSTOMER PERKS & BESPOKE TAILORING ────────────────────────── */}
      <section className="container mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
            White-Glove Customer Experience
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-neutral-900 mt-2 mb-4">
            Why Furnish With National Interiors
          </h2>
          <p className="text-neutral-600 text-sm md:text-base">
            Every collection piece is precision-tailored to your exact home floor plan with our Bengaluru architectural guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:border-[#8C7355]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-neutral-200 flex items-center justify-center text-[#8C7355] mb-5">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              Custom Dimensions & Finishes
            </h3>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
              Love a collection but need a sofa 6 inches wider or a dining table in smoked oak instead of teak? Our 40,000 sq.ft factory customizes any piece to your dimensions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:border-[#8C7355]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-neutral-200 flex items-center justify-center text-[#8C7355] mb-5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              Doorstep Material Swatch Kits
            </h3>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
              Touch real solid Burma teak, walnut samples, and stain-resistant fabric swatches under your home’s actual lighting before finalizing your order.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm hover:border-[#8C7355]/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-neutral-200 flex items-center justify-center text-[#8C7355] mb-5">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-medium text-neutral-900 mb-2">
              Experience Studios in Bengaluru
            </h3>
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed">
              Visit our experiential flagship studios in Indiranagar, Whitefield, and HSR Layout. Test seating ergonomics and consult with our principal designers.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. LEAD GENERATION & ARCHITECTURAL CONSULTATION CTA ───────────── */}
      <section className="bg-[#171717] text-white py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 bg-neutral-900 border border-neutral-800 p-8 md:p-12 rounded-2xl">
            <div>
              <span className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest">
                Full Home Furnishing & Turnkey Interiors
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-light text-white mt-2 mb-3">
                Need a Whole-Home Furniture Package?
              </h3>
              <p className="text-neutral-400 text-sm max-w-xl leading-relaxed">
                Save up to 18% when furnishing an entire 2BHK, 3BHK, or luxury villa in Bengaluru. Includes free 3D spatial layout and white-glove setup.
              </p>
            </div>
            <Link
              href="/design-services#cost-estimator"
              className="whitespace-nowrap px-6 py-3.5 bg-[#8C7355] hover:bg-[#705c43] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <span>Calculate Room Budget</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
