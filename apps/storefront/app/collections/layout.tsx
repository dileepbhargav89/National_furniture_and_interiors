import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Curated Living Collections & Architectural Suites | National Furniture & Interiors Bengaluru',
  description:
    'Explore curated solid Burma teakwood and tailored upholstery suites designed for modern Bengaluru homes. 45-day handover guarantee, 10-year BWP warranty, and free white-glove setup.',
  keywords: [
    'furniture collections Bengaluru',
    'curated living room suites',
    'solid teakwood collections',
    'architectural furniture India',
    'Urban Ladder luxury alternatives',
    'Japandi furniture Bengaluru',
    'mid-century modern teak',
  ],
  openGraph: {
    title: 'Curated Living Collections & Architectural Suites | National Furniture & Interiors Bengaluru',
    description:
      'Explore curated solid Burma teakwood and tailored upholstery suites designed for modern Bengaluru homes. 45-day handover guarantee, 10-year BWP warranty, and free white-glove setup.',
    type: 'website',
  },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
