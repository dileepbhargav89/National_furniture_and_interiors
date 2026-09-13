'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@nfi/api-client';
import { ProductCard } from './product-card';
import { QuickViewModal } from './quick-view-modal';

export interface RelatedProductsCarouselProps {
  products: Product[];
  categoryName?: string | undefined;
}

export function RelatedProductsCarousel({
  products,
  categoryName,
}: RelatedProductsCarouselProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  if (!products || products.length === 0) return null;

  const handleQuickView = (productId: string) => {
    const found = products.find((p) => (p.id || p._id) === productId);
    if (found) {
      setQuickViewProduct(found);
    }
  };

  return (
    <section className="w-full mt-24 pt-16 border-t border-[#EBE8E3]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#8C7355] uppercase block mb-1">
            {categoryName ? `Complementary in ${categoryName}` : 'Curated Living Collection'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 font-normal tracking-tight">
            You May Also Admire
          </h2>
        </div>

        <Link
          href="/products"
          className="text-xs font-semibold uppercase tracking-wider text-neutral-900 hover:text-amber-800 transition-colors inline-flex items-center gap-1 group"
        >
          <span>Explore All Furniture</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      </div>

      {/* Grid of Related Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 4).map((item) => {
          const id = item.id || item._id || '';
          const basePriceAmt = (item.basePrice?.amount || 0) / 100;
          const mrpAmt = item.mrp ? item.mrp.amount / 100 : null;
          const images = item.images?.map((img) => img.url) || [];
          const hasVideo = Boolean(item.videos && item.videos.length > 0);

          return (
            <ProductCard
              key={id}
              id={id}
              name={item.name}
              slug={item.slug}
              price={basePriceAmt}
              mrp={mrpAmt}
              currency={item.basePrice?.currency || 'INR'}
              images={images}
              category={categoryName || 'Furniture'}
              material={item.material || (item as unknown as { primaryMaterial?: string }).primaryMaterial}
              ratingsAvg={item.ratingsAvg}
              ratingsCount={item.ratingsCount}
              isFeatured={item.isFeatured}
              isBestSeller={item.isBestSeller}
              productType={item.productType}
              finishes={item.finishes}
              hasVideo={hasVideo}
              onQuickView={handleQuickView}
            />
          );
        })}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          isOpen={Boolean(quickViewProduct)}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </section>
  );
}
