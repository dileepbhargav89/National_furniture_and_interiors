'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface PatronReview {
  name: string;
  location: string;
  rating: number;
  productName: string;
  quote: string;
  image: string;
}

const PATRON_REVIEWS: PatronReview[] = [
  {
    name: 'Ananya & Rohit Sharma',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    productName: 'Vetra 3-Seater Italian Leather Sofa',
    quote:
      'The leather is butter-soft and the seat cushioning has zero sag after 8 months of daily family use. White-glove delivery was completely hassle-free.',
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Dr. Vivek Mehra',
    location: 'Jubilee Hills, Hyderabad',
    rating: 5,
    productName: 'Solid Teak 8-Seater Dining Table',
    quote:
      'Finding genuinely seasoned teak without chemical smells is rare today. The grain matches our heritage home effortlessly. Outstanding craftsmanship.',
    image:
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Kavita Krishnamurthy',
    location: 'Koramangala, Bengaluru',
    rating: 5,
    productName: 'Webster Credenza & Shoe Storage',
    quote:
      'Impeccable joinery and the louvred slats provide natural ventilation. It feels like an art installation in our foyer.',
    image:
      'https://images.unsplash.com/photo-1595514535133-c28308d5f303?q=80&w=600&auto=format&fit=crop',
  },
];

export function PatronReviewsSection() {
  return (
    <section className="py-16 sm:py-20 bg-white border-t border-[#EBE8E3]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex text-amber-500 text-xs">
                {'★★★★★'}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                4.8 / 5 Rating (360+ Verified Patrons)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#171717] tracking-tight">
              Homes Styled by National Furniture
            </h2>
          </div>

          <Link
            href="/products"
            className="text-xs font-medium text-[#8C7355] hover:text-black uppercase tracking-wider underline underline-offset-4"
          >
            Explore All 90+ Pieces
          </Link>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PATRON_REVIEWS.map((review) => (
            <div
              key={review.name}
              className="flex flex-col rounded-lg border border-[#E5E0D8] bg-[#FAF9F6] overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
            >
              {/* Image of piece in home */}
              <div className="relative aspect-[16/10] w-full bg-gray-100">
                <Image
                  src={review.image}
                  alt={review.productName}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] text-white font-medium">
                  Verified Patron Home
                </span>
              </div>

              {/* Review Text */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex text-amber-500 text-xs">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Verified Purchase
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 italic leading-relaxed mb-4">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-[11px] text-gray-500">{review.location}</p>
                  <p className="text-[10px] text-[#8C7355] font-medium mt-0.5 truncate">
                    Purchased: {review.productName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
