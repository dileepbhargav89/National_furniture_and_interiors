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
import { SwatchOrderModal } from '../../components/swatches/swatch-order-modal';
import { ConsultationSchedulerModal } from '../../components/consultation/consultation-scheduler-modal';

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
  const [showSwatchModal, setShowSwatchModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

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
              heroImage:
                col.heroImage?.url ||
                'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
              designerQuote:
                'Curated architectural proportions and premium finishes built for modern Bengaluru living.',
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
          const staticEnriched: EnrichedCollection[] = Object.values(CURATED_COLLECTIONS_DATA).map(
            (enr) => ({
              id: enr.slug,
              title: enr.title,
              slug: enr.slug,
              shortDescription: enr.designerQuote,
              heroImage: { url: enr.heroImage, altText: enr.title },
              enrichment: enr,
            }),
          );
          setCollections(staticEnriched);
        }
      } catch (err) {
        console.error('Failed to fetch collections, activating curated fallback:', err);
        const staticEnriched: EnrichedCollection[] = Object.values(CURATED_COLLECTIONS_DATA).map(
          (enr) => ({
            id: enr.slug,
            title: enr.title,
            slug: enr.slug,
            shortDescription: enr.designerQuote,
            heroImage: { url: enr.heroImage, altText: enr.title },
            enrichment: enr,
          }),
        );
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
      <section className="relative overflow-hidden bg-[#171717] pb-20 pt-24 text-white md:pb-28 md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#8C7355_1px,transparent_1px)] opacity-15 [background-size:24px_24px]"></div>
        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D4AF37] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              Bengaluru Architectural Suites · 2026 Collection
            </div>
            <h1 className="mb-6 font-serif text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Curated Living Collections
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-base font-light leading-relaxed text-neutral-300 md:text-xl">
              Harmonized furniture suites designed by our Bengaluru interior architects. Handcrafted
              in solid Burma teak, seasoned sheesham, and European linen — sized for modern Indian
              layouts.
            </p>

            {/* Quick Trust Highlights Bar */}
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 border-t border-white/10 pt-6 text-left sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-medium text-neutral-400">45-Day Delivery</p>
                  <p className="text-xs font-semibold text-white">With SLA Guarantee</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-medium text-neutral-400">10-Year Warranty</p>
                  <p className="text-xs font-semibold text-white">BWP Marine Grade</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-medium text-neutral-400">100% Solid Wood</p>
                  <p className="text-xs font-semibold text-white">Seasoned Teakwood</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 shrink-0 text-[#D4AF37]" />
                <div>
                  <p className="text-xs font-medium text-neutral-400">Bengaluru Setup</p>
                  <p className="text-xs font-semibold text-white">Free White-Glove</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INTERACTIVE FILTER & SEARCH TOOLBAR ──────────────────────── */}
      <section className="sticky top-16 z-30 border-b border-neutral-200 bg-white/95 shadow-sm backdrop-blur-md transition-all">
        <div className="container mx-auto px-4 py-4 md:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            {/* Room Tabs */}
            <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0">
              {ROOM_CATEGORIES.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 md:text-sm ${
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
                <label htmlFor={searchInputId} className="sr-only">
                  Search collections
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Search collections or materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-3 text-xs text-neutral-900 focus:border-[#8C7355] focus:outline-none focus:ring-1 focus:ring-[#8C7355] md:text-sm"
                />
              </div>

              {/* Style Dropdown */}
              <div className="relative">
                <label htmlFor={styleSelectId} className="sr-only">
                  Filter by aesthetic style
                </label>
                <select
                  id={styleSelectId}
                  value={activeStyle}
                  onChange={(e) => setActiveStyle(e.target.value)}
                  className="cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-3 pr-8 text-xs font-medium text-neutral-800 focus:border-[#8C7355] focus:outline-none md:text-sm"
                >
                  {AESTHETIC_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
                <SlidersHorizontal className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CURATED COLLECTIONS GRID ─────────────────────────────────── */}
      <section className="container mx-auto px-4 py-14 md:px-8">
        {/* Results Counter & Filter Feedback */}
        <div className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-3">
          <p className="text-xs font-medium text-neutral-500 md:text-sm">
            Showing{' '}
            <span className="font-semibold text-neutral-900">{filteredCollections.length}</span>{' '}
            curated design suites
            {activeRoom !== 'all' && (
              <span>
                {' '}
                in{' '}
                <strong className="text-neutral-900">
                  {ROOM_CATEGORIES.find((r) => r.id === activeRoom)?.label}
                </strong>
              </span>
            )}
            {activeStyle !== 'All Styles' && (
              <span>
                {' '}
                · <strong className="text-neutral-900">{activeStyle}</strong>
              </span>
            )}
          </p>
          {(activeRoom !== 'all' || activeStyle !== 'All Styles' || searchQuery) && (
            <button
              onClick={() => {
                setActiveRoom('all');
                setActiveStyle('All Styles');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-[#8C7355] underline underline-offset-4 hover:text-[#705c43]"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Loading State Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] w-full bg-neutral-200"></div>
                <div className="space-y-4 p-6">
                  <div className="h-4 w-1/3 rounded bg-neutral-200"></div>
                  <div className="h-6 w-3/4 rounded bg-neutral-200"></div>
                  <div className="h-3 w-full rounded bg-neutral-200"></div>
                  <div className="mt-4 h-10 w-full rounded-lg bg-neutral-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCollections.length === 0 ? (
          /* Empty State */
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-neutral-300 bg-white p-8 py-24 text-center">
            <Compass className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
            <h3 className="mb-2 font-serif text-2xl font-light text-neutral-900">
              No matching collections found
            </h3>
            <p className="mb-6 text-sm text-neutral-500">
              We couldn’t find any suites matching your filter criteria. Try resetting your search
              or room filter.
            </p>
            <button
              onClick={() => {
                setActiveRoom('all');
                setActiveStyle('All Styles');
                setSearchQuery('');
              }}
              className="rounded-lg bg-[#171717] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
            >
              View All Collections
            </button>
          </div>
        ) : (
          /* Rich High-Density Collection Cards */
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCollections.map((col, index) => {
              const enr = col.enrichment;
              const imgUrl = col.heroImage?.url || enr.heroImage;

              return (
                <div
                  key={col.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition-all duration-300 hover:border-[#8C7355]/40 hover:shadow-xl"
                >
                  {/* Card Visual Header */}
                  <Link
                    href={`/collections/${col.slug}`}
                    className="relative block aspect-[16/10] overflow-hidden bg-neutral-900"
                  >
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
                    <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-neutral-900 shadow-sm backdrop-blur-md">
                        {enr.curatedBadge}
                      </span>
                      <span className="rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-[#D4AF37] backdrop-blur-md">
                        {enr.pieceCount} Coordinated Pieces
                      </span>
                    </div>

                    {/* Bottom Image Overlay Details */}
                    <div className="absolute bottom-3 left-3.5 right-3.5 text-white">
                      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-neutral-300">
                        <span>{enr.roomLabel}</span>
                        <span>•</span>
                        <span>{enr.style}</span>
                      </div>
                      <h2 className="font-serif text-xl font-light leading-tight text-white transition-colors group-hover:text-[#D4AF37] sm:text-2xl">
                        {col.title}
                      </h2>
                    </div>
                  </Link>

                  {/* Card Body Information */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      {/* Short Description / Designer Philosophy */}
                      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                        {col.shortDescription || enr.designerQuote}
                      </p>

                      {/* Material Tags */}
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {enr.materials.map((mat, i) => (
                          <span
                            key={i}
                            className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                          >
                            {mat}
                          </span>
                        ))}
                      </div>

                      {/* Popular In Bangalore Communities */}
                      <div className="mb-4 flex items-center gap-1.5 rounded-lg border border-amber-100/60 bg-amber-50/70 p-2 text-[11px] text-neutral-500">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#8C7355]" />
                        <span className="truncate">
                          Favored in:{' '}
                          <strong className="text-neutral-800">
                            {enr.popularInSocieties.join(', ')}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Pricing, Discount & Action Footer */}
                    <div className="mt-2 border-t border-neutral-100 pt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            Full Suite Package
                          </p>
                          <p className="flex items-center font-serif text-lg font-semibold text-neutral-900">
                            <span>₹{enr.startingPrice.toLocaleString('en-IN')}</span>
                            <span className="ml-1.5 text-[11px] font-normal text-neutral-500">
                              onwards
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Save {enr.bundleDiscountPercent}% Bundle
                          </span>
                          <p className="mt-0.5 text-[11px] text-neutral-500">
                            EMI from ₹{enr.emiMonthly.toLocaleString('en-IN')}/mo
                          </p>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          href={`/collections/${col.slug}`}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#171717] px-3 py-2.5 text-xs font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-[#8C7355] group-hover:shadow"
                        >
                          <span>Explore Suite</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href="/design-services#lead-form"
                          className="flex items-center justify-center rounded-lg border border-neutral-300 px-3 py-2.5 text-xs font-medium text-neutral-800 transition-colors hover:border-neutral-900"
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
      <section className="border-y border-neutral-200 bg-white py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-12 max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7355]">
              Bengaluru Apartment Inspiration
            </span>
            <h2 className="mb-4 mt-2 font-serif text-3xl font-light text-neutral-900 md:text-4xl">
              Shop The Look: The Indiranagar Penthouse Suite
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
              Experience how our Mid-Century and Scandinavian pieces integrate seamlessly into
              double-height living spaces. Every piece is precision-crafted at our 40,000 sq.ft
              Bengaluru manufacturing facility.
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Visual Ambiance */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200 shadow-lg lg:col-span-7">
              <Image
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop"
                alt="Penthouse Living Room Suite"
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                Installed at Kingfisher Towers
              </div>
            </div>

            {/* Curated Pieces in this Setup */}
            <div className="space-y-4 lg:col-span-5">
              <h3 className="mb-2 font-serif text-xl font-medium text-neutral-900">
                Featured in this Room Setup
              </h3>

              <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-[#FAF9F6] p-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                  <Image
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=200&auto=format&fit=crop"
                    alt="Solid Teak Sofa"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-neutral-900">
                    Venezia 3-Seater Teak Sofa
                  </h4>
                  <p className="text-xs text-neutral-500">Solid Teakwood · Belgian Bouclé</p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">₹48,500</p>
                </div>
                <Link
                  href="/products"
                  className="shrink-0 text-xs font-semibold text-[#8C7355] hover:underline"
                >
                  View Piece
                </Link>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-[#FAF9F6] p-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                  <Image
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=200&auto=format&fit=crop"
                    alt="Marble Top Coffee Table"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-neutral-900">
                    Aura Marble Fluted Coffee Table
                  </h4>
                  <p className="text-xs text-neutral-500">Italian Marble · Brass Accent</p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">₹24,900</p>
                </div>
                <Link
                  href="/products"
                  className="shrink-0 text-xs font-semibold text-[#8C7355] hover:underline"
                >
                  View Piece
                </Link>
              </div>

              <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-[#FAF9F6] p-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                  <Image
                    src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=200&auto=format&fit=crop"
                    alt="Media Console"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-neutral-900">
                    Koben Teak Media Credenza
                  </h4>
                  <p className="text-xs text-neutral-500">Century 710 Plywood · Fluted Slats</p>
                  <p className="mt-0.5 text-xs font-semibold text-neutral-900">₹34,000</p>
                </div>
                <Link
                  href="/products"
                  className="shrink-0 text-xs font-semibold text-[#8C7355] hover:underline"
                >
                  View Piece
                </Link>
              </div>

              <div className="pt-2">
                <Link
                  href="/collections/mid-century-modern-living"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#8C7355] md:text-sm"
                >
                  <span>Shop Entire Penthouse Suite (Save ₹12,800)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CUSTOMER PERKS & BESPOKE TAILORING ────────────────────────── */}
      <section className="container mx-auto px-4 py-20 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8C7355]">
            White-Glove Customer Experience
          </span>
          <h2 className="mb-4 mt-2 font-serif text-3xl font-light text-neutral-900 md:text-4xl">
            Why Furnish With National Interiors
          </h2>
          <p className="text-sm text-neutral-600 md:text-base">
            Every collection piece is precision-tailored to your exact home floor plan with our
            Bengaluru architectural guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#8C7355]/50">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-[#FAF9F6] text-[#8C7355]">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-serif text-lg font-medium text-neutral-900">
              Custom Dimensions & Finishes
            </h3>
            <p className="text-xs leading-relaxed text-neutral-600 sm:text-sm">
              Love a collection but need a sofa 6 inches wider or a dining table in smoked oak
              instead of teak? Our 40,000 sq.ft factory customizes any piece to your dimensions.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#8C7355]/50">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-[#FAF9F6] text-[#8C7355]">
                <Layers className="h-6 w-6" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-neutral-900">
                  Doorstep Material Swatch Kits
                </h3>
                <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                  ₹499 Refundable
                </span>
              </div>
              <p className="mb-5 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                Touch real solid Burma teak, walnut samples, and stain-resistant fabric swatches
                under your home’s actual lighting before finalizing your order.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSwatchModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-4 py-2.5 text-xs font-semibold text-white shadow transition-colors hover:bg-neutral-800"
            >
              <span>Order Swatch Box (Bengaluru 48h)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-[#8C7355]/50">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-[#FAF9F6] text-[#8C7355]">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-serif text-lg font-medium text-neutral-900">
                Experience Studios in Bengaluru
              </h3>
              <p className="mb-5 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                Visit our experiential flagship studios in Indiranagar, Whitefield, and HSR Layout.
                Test seating ergonomics and consult with our principal designers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConsultationModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
            >
              <span>Book Studio Visit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. LEAD GENERATION & ARCHITECTURAL CONSULTATION CTA ───────────── */}
      <section className="bg-[#171717] py-16 text-white">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 md:flex-row md:p-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
                Full Home Furnishing & Turnkey Interiors
              </span>
              <h3 className="mb-3 mt-2 font-serif text-2xl font-light text-white md:text-3xl">
                Need a Whole-Home Furniture Package?
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-neutral-400">
                Save up to 18% when furnishing an entire 2BHK, 3BHK, or luxury villa in Bengaluru.
                Includes free 3D spatial layout and white-glove setup.
              </p>
            </div>
            <Link
              href="/design-services#cost-estimator"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#8C7355] px-6 py-3.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#705c43] md:text-sm"
            >
              <span>Calculate Room Budget</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. SWATCH BOX ORDER MODAL & CONSULTATION MODAL ────────────────── */}
      <SwatchOrderModal isOpen={showSwatchModal} onClose={() => setShowSwatchModal(false)} />

      <ConsultationSchedulerModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        defaultMode="STUDIO_VISIT"
      />
    </div>
  );
}
