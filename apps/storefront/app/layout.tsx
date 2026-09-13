import { NFIHeader } from '../components/header';
import { Footer } from '../components/footer';
import { CartProvider } from '../context/cart-context';
import { WishlistProvider } from '../context/wishlist-context';
import { AuthProvider } from '../providers/auth-provider';
import { FloatingContact } from '../components/floating-contact';
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
  title: 'National Furniture & Interiors',
  description: 'Premium furniture and interior design services.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`} style={{ background: 'var(--nfi-cream)', color: 'var(--nfi-text)' }}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <NFIHeader />
              <main className="min-h-screen">
                {children}
              </main>
              <FloatingContact />
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
