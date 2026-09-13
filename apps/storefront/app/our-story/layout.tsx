import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Our Story & Heritage | National Furniture & Interiors Bengaluru',
  description:
    'Discover the 28+ year woodcraft heritage of National Furniture & Interiors. From our 1998 founding in Bengaluru to our 40,000 sq.ft manufacturing atelier, explore how we build solid teak furniture and luxury turnkey interiors.',
  openGraph: {
    title: 'Our Story & Heritage | National Furniture & Interiors Bengaluru',
    description:
      '28+ years of dedicated solid wood craftsmanship, a 40,000 sq.ft manufacturing atelier in Bengaluru, and 1,200+ homes styled. Learn about our master joinery and direct atelier value.',
    url: 'https://nationalinteriors.in/our-story',
    siteName: 'National Furniture & Interiors',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'National Furniture & Interiors Craftsmanship & Living Suites',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function OurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
