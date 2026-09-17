/**
 * Storefront Production & Custom URL Resolver
 * Defaults to the live National Furniture & Interiors storefront: https://national-furniture-and-interiors-st.vercel.app
 */
export const STOREFRONT_BASE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  'https://national-furniture-and-interiors-st.vercel.app';

export function getStorefrontUrl(path: string = ''): string {
  const base = STOREFRONT_BASE_URL.replace(/\/+$/, '');
  if (!path) return base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
