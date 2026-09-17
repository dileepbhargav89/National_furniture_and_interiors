'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CatalogService, Product } from '@nfi/api-client';
import { HeroBanner } from '../components/HeroBanner';
import { TrustBadgeStrip } from '../components/home/trust-badge-strip';
import { CompactCategoryCard, CompactCategoryItem } from '../components/home/compact-category-card';
import { CraftsmanshipSpotlight } from '../components/home/craftsmanship-spotlight';
import { DesignServicesSection } from '../components/home/design-services-section';
import { PatronReviewsSection } from '../components/home/patron-reviews-section';
import { ProductCard } from '../components/product-card';
import { ProductSkeleton } from '../components/product-skeleton';
import { QuickViewModal } from '../components/quick-view-modal';
import { NewsletterForm } from '../components/NewsletterForm';

// Curated compact 6-room category data aligned with active database slugs
const COMPACT_ROOM_CATEGORIES: CompactCategoryItem[] = [
  {
    name: 'Sofas & Seating',
    slug: 'sofas',
    count: 17,
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Living & Storage',
    slug: 'living-room',
    count: 17,
    image:
      'https://images.unsplash.com/photo-1595514535133-c28308d5f303?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Dining & Tables',
    slug: 'dining',
    count: 19,
    image:
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Beds & Bedroom',
    slug: 'bedroom',
    count: 19,
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Study & Office',
    slug: 'office',
    count: 17,
    image:
      'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Outdoor Living',
    slug: 'outdoor',
    count: 8,
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        const res = await CatalogService.listProducts({ limit: 8, sortBy: 'featured' });
        const items = res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setFeaturedProducts(items);
      } catch (err) {
        console.error('Failed to load featured products for home page:', err);
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const openQuickView = (id: string) => {
    const found = featuredProducts.find((p) => (p.id || p._id) === id);
    if (found) setQuickViewProduct(found);
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--nfi-cream)', color: 'var(--nfi-text)' }}
    >
      {/* 1. Hero Showcase */}
      <HeroBanner />

      {/* 2. Customer Trust & Value Assurance Bar */}
      <TrustBadgeStrip />

      {/* 3. Compact Room & Category Grid (Reduced Card Size) */}
      <section className="bg-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{ color: 'var(--nfi-orange)' }}
              >
                Curated Spaces
              </p>
              <h2
                className="font-serif text-2xl font-normal tracking-tight sm:text-3xl"
                style={{ color: 'var(--nfi-brown-dark)' }}
              >
                Explore by Room
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-semibold uppercase tracking-wider underline underline-offset-4 transition-colors hover:opacity-80"
              style={{ color: 'var(--nfi-orange)' }}
            >
              View All Categories &rarr;
            </Link>
          </div>

          {/* 6-Column Compact Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {COMPACT_ROOM_CATEGORIES.map((room, idx) => (
              <CompactCategoryCard key={room.slug} item={room} priority={idx < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curator's Bestsellers (Compact Product Cards with Live Data) */}
      <section className="border-y border-[#EBE8E3] bg-[#FAF9F6] py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p
                className="mb-1 text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{ color: 'var(--nfi-orange)' }}
              >
                Handpicked Heirloom Craft
              </p>
              <h2
                className="font-serif text-2xl font-normal tracking-tight sm:text-3xl"
                style={{ color: 'var(--nfi-brown-dark)' }}
              >
                Curator&apos;s Signature Pieces
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--nfi-text-secondary)' }}>
                Mastercrafted from seasoned teak, white oak, and top-grain Italian leather.
              </p>
            </div>
            <Link
              href="/products?sort=featured"
              className="text-xs font-semibold uppercase tracking-wider underline underline-offset-4 transition-colors hover:opacity-80"
              style={{ color: 'var(--nfi-orange)' }}
            >
              Shop Full Collection (90+ Pieces) &rarr;
            </Link>
          </div>

          {/* 4-Column Compact Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-white py-12 text-center text-xs text-gray-400">
              Catalog synchronization in progress. Please explore our full product collection.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {featuredProducts.slice(0, 8).map((product, idx) => (
                <ProductCard
                  key={product.id || product._id}
                  id={product.id || (product._id as string)}
                  name={product.name}
                  slug={product.slug}
                  price={product.basePrice?.amount}
                  mrp={product.mrp?.amount}
                  currency={product.basePrice?.currency || 'INR'}
                  images={
                    product.images?.map((img) => (typeof img === 'string' ? img : img.url)) || []
                  }
                  category="Furniture"
                  material={product.material}
                  ratingsAvg={product.ratingsAvg}
                  ratingsCount={product.ratingsCount}
                  isFeatured={product.isFeatured}
                  isBestSeller={product.isBestSeller}
                  productType={product.productType}
                  finishes={product.finishes}
                  viewMode="grid4"
                  hasVideo={Boolean(product.videos && product.videos.length > 0)}
                  priority={idx < 4}
                  onQuickView={openQuickView}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Workshop Craftsmanship & Cinematic Reels */}
      <CraftsmanshipSpotlight />

      {/* 6. Dual Revenue Engine: Turnkey Interior Design Services */}
      <DesignServicesSection />

      {/* 7. Verified Patron Stories & Social Proof */}
      <PatronReviewsSection />

      {/* 8. VIP Design Circle & Newsletter */}
      <section className="py-14 text-white" style={{ backgroundColor: 'var(--nfi-brown-dark)' }}>
        <div className="container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em]"
            style={{ color: 'var(--nfi-orange)' }}
          >
            The National Interior Circle
          </p>
          <h2 className="mb-2 font-serif text-2xl font-normal tracking-tight text-white sm:text-3xl">
            Unlock 10% Off Your First Bespoke Piece
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-xs text-white/60 sm:text-sm">
            Join our private patron circle for preview access to limited timber harvests,
            architectural masterclasses, and VIP seasonal exhibitions. Use code{' '}
            <span className="font-mono font-semibold" style={{ color: 'var(--nfi-orange-light)' }}>
              NFI10
            </span>{' '}
            at checkout.
          </p>

          <div className="mx-auto max-w-md">
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Quick View Modal Island */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
