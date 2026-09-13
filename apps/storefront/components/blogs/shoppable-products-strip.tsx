'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ShoppableProductRef } from '../../data/blog-chronicles';

interface ShoppableProductsStripProps {
  products: ShoppableProductRef[];
  title?: string;
  subtitle?: string;
}

export function ShoppableProductsStrip({
  products,
  title = 'Featured Masterpieces in this Residence',
  subtitle = 'Heirloom furniture designed and crafted in our Bengaluru atelier for this commission.',
}: ShoppableProductsStripProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="my-14 p-6 md:p-8 rounded-2xl bg-gradient-to-b from-[#FAF9F6] to-stone-100 border border-[#C5A059]/30 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-[#C5A059] mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            Shoppable Architectural Aesthetic
          </span>
          <h3 className="text-xl md:text-2xl font-serif text-[#171717]">
            {title}
          </h3>
          <p className="text-xs md:text-sm text-stone-500 mt-1 max-w-xl font-light">
            {subtitle}
          </p>
        </div>
        <Link
          href="/catalog"
          className="mt-4 md:mt-0 inline-flex items-center text-xs uppercase tracking-widest text-[#171717] font-medium hover:text-[#C5A059] transition-colors group"
        >
          Explore Full Catalog
          <span className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col justify-between bg-white rounded-xl overflow-hidden border border-stone-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#C5A059]/60 transition-all duration-300"
          >
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="absolute top-3 left-3 bg-[#171717]/85 backdrop-blur-sm text-white text-[10px] tracking-widest uppercase font-medium px-2.5 py-1 rounded-sm">
                  {product.category}
                </span>
              </div>

              <div className="p-5">
                <h4 className="text-base font-serif font-medium text-[#171717] group-hover:text-[#C5A059] transition-colors line-clamp-1">
                  {product.name}
                </h4>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed font-light">
                  {product.materials}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 block font-light">
                  Atelier Price
                </span>
                <span className="text-base font-serif font-semibold text-[#171717]">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              </div>

              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center px-3.5 py-1.5 text-xs font-medium tracking-wide text-white bg-[#171717] hover:bg-[#C5A059] rounded-md transition-colors shadow-sm"
              >
                View Piece
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
