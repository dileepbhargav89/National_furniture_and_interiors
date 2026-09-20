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
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=600&auto=format&fit=crop',
  },
];

export function PatronReviewsSection() {
  return (
    <section className="border-t border-[#EBE8E3] bg-white py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex text-xs text-amber-500">{'★★★★★'}</div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">
                4.8 / 5 Rating (360+ Verified Patrons)
              </span>
            </div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-[#171717] sm:text-3xl">
              Homes Styled by National Furniture
            </h2>
          </div>

          <Link
            href="/products"
            className="text-xs font-medium uppercase tracking-wider text-[#8C7355] underline underline-offset-4 hover:text-black"
          >
            Explore All 90+ Pieces
          </Link>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PATRON_REVIEWS.map((review) => (
            <div
              key={review.name}
              className="shadow-2xs flex flex-col overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#FAF9F6] transition-shadow hover:shadow-md"
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
                <span className="backdrop-blur-xs absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                  Verified Patron Home
                </span>
              </div>

              {/* Review Text */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex text-xs text-amber-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      ✓ Verified Purchase
                    </span>
                  </div>

                  <p className="mb-4 text-xs italic leading-relaxed text-gray-700">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <h4 className="text-xs font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-[11px] text-gray-500">{review.location}</p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-[#8C7355]">
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
