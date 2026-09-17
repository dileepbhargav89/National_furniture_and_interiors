/**
 * Storefront Production & Custom URL Resolver
 * Defaults to the live National Furniture & Interiors production storefront: https://nationalinteriors.in
 */
export const STOREFRONT_BASE_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL || 'https://nationalinteriors.in';

export function getStorefrontUrl(path: string = ''): string {
  const base = STOREFRONT_BASE_URL.replace(/\/+$/, '');
  if (!path) return base;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
