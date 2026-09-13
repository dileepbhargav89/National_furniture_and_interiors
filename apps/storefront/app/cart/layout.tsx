import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bespoke Furniture Cart & Bag | National Furniture & Interiors',
  description:
    'Review your bespoke solid wood furniture commissions, verify Bengaluru white-glove delivery, and proceed to secure checkout with 10-year warranty protection.',
  openGraph: {
    title: 'Bespoke Cart | National Furniture & Interiors',
    description:
      'Handcrafted Burma Teak, Sheesham, and Oak furniture pieces ready for manufacturing and white-glove installation.',
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
