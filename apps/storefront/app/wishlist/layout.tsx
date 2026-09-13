import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Your Saved Wishlist | National Furniture & Interiors Bengaluru',
  description:
    'Review and curate your saved bespoke solid teak furniture, tailored sofas, and architectural suites at National Furniture & Interiors Bengaluru.',
  openGraph: {
    title: 'Your Saved Wishlist | National Furniture & Interiors Bengaluru',
    description:
      'View your curated furniture wishlist. Move items to cart, request customization quotes, or book a free 3D home styling consultation.',
    url: 'https://nationalinteriors.in/wishlist',
    siteName: 'National Furniture & Interiors',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function WishlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
