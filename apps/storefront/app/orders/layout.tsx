import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'My Orders & Real-Time Tracking | National Furniture & Interiors',
  description:
    'Track your bespoke furniture manufacturing, timber seasoning, and white-glove installation progress with National Furniture & Interiors Bengaluru.',
  openGraph: {
    title: 'My Orders & Real-Time Tracking | National Furniture & Interiors',
    description:
      'Live woodcraft production tracking and delivery status for your National Furniture & Interiors order.',
    url: 'https://nationalinteriors.in/orders',
    siteName: 'National Furniture & Interiors',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
