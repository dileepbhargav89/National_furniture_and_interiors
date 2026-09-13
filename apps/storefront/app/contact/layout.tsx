import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact National Furniture & Interiors | HSR Layout Bengaluru Flagship Store',
  description:
    'Connect with National Furniture & Interiors in HSR Layout, Bengaluru. Visit our flagship experience center, chat on WhatsApp (+91 9663628302), explore factory-direct custom furniture, and book free 3D interior consultations.',
  openGraph: {
    title: 'Contact National Furniture & Interiors | HSR Layout Bengaluru Flagship Store',
    description:
      'Visit our HSR Layout showroom opposite Purva Fairmont or chat directly on WhatsApp (+91 9663628302) for factory-direct bespoke furniture and turnkey interior design in Bengaluru.',
    url: 'https://nationalinteriors.in/contact',
    siteName: 'National Furniture & Interiors',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'National Furniture & Interiors HSR Layout Experience Center',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
