// Root layout — required by Next.js App Router (docs/07_technology_decision_record.md §3).
import './globals.css';
import { Inter } from 'next/font/google';

import type { Viewport } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'National Furniture & Interiors — Admin',
  description: 'Admin dashboard for National Furniture & Interiors',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>{children}</body>
    </html>
  );
}
