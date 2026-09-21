'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/cart-context';
import { useWishlist } from '../context/wishlist-context';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null | undefined;
  currency: string;
  images: string[];
  category: string;
  material?: string | undefined;
  ratingsAvg?: number | null | undefined;
  ratingsCount?: number | null | undefined;
  isFeatured?: boolean | undefined;
  isBestSeller?: boolean | undefined;
  productType?: string | undefined;
  finishes?: string[] | undefined;
  viewMode?: 'grid3' | 'grid4' | 'grid5' | 'list' | undefined;
  hasVideo?: boolean | undefined;
  priority?: boolean | undefined;
  onQuickView?: ((id: string) => void) | undefined;
}

function isValidImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('example.com')) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:')
  );
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  mrp,
  currency,
  images,
  category,
  material,
  ratingsAvg,
  ratingsCount,
  isFeatured,
  isBestSeller,
  productType,
  finishes,
  viewMode = 'grid3',
  hasVideo = false,
  priority = false,
  onQuickView,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { isWishlisted: checkIsWishlisted, toggleWishlist: toggleWishlistGlobal } = useWishlist();
  const isWishlisted = checkIsWishlisted(id);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlistGlobal({
      id,
      name,
      slug,
      price,
      mrp,
      currency,
      images,
      category,
      material,
    });
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price / 100);

  const formattedMrp =
    mrp && mrp > price
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(mrp / 100)
      : null;

  const discountPercentage = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addItem({ productId: id, variantId: `${id}-var-1`, quantity: 1 });
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        setAdding(false);
      }, 1200);
    } catch {
      setAdding(false);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(id);
    }
  };

  const rawPrimary = images[0];
  const rawSecondary = images.length > 1 ? images[1] : rawPrimary;

  const primaryImage = isValidImageUrl(rawPrimary) && !imgError ? rawPrimary : undefined;
  const secondaryImage = isValidImageUrl(rawSecondary) && !imgError ? rawSecondary : primaryImage;

  // Render horizontal List View
  if (viewMode === 'list') {
    return (
      <div
        className="group relative flex flex-col gap-6 rounded-lg border border-[#EBE8E3] bg-white p-4 transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-md sm:flex-row"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Thumbnail */}
        <Link
          href={`/products/${slug}`}
          className="relative h-64 w-full shrink-0 overflow-hidden rounded bg-[#FAF9F6] sm:w-60"
        >
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={name}
                fill
                priority={priority}
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 100vw, 240px"
                className={`object-cover transition-opacity duration-500 ease-in-out ${
                  isHovered && secondaryImage !== primaryImage ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {secondaryImage && secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${name} secondary perspective`}
                  fill
                  sizes="(max-width: 640px) 100vw, 240px"
                  className={`object-cover transition-all duration-500 ease-in-out ${
                    isHovered ? 'scale-105 opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <span>No image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
            {discountPercentage > 0 && (
              <span className="bg-[#171717] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                -{discountPercentage}%
              </span>
            )}
            {hasVideo && (
              <span className="backdrop-blur-xs shadow-xs inline-flex items-center gap-1 rounded bg-[#171717]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                <svg className="h-2.5 w-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Video</span>
              </span>
            )}
          </div>
        </Link>

        {/* Center Details */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#8C7355]">
                {category}
              </span>
              <button
                onClick={toggleWishlist}
                className="p-1.5 text-gray-400 transition-colors hover:text-red-500"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </button>
            </div>

            <Link href={`/products/${slug}`}>
              <h3 className="mt-1 font-serif text-lg font-normal text-[#171717] transition-colors group-hover:text-[#B7791F]">
                {name}
              </h3>
            </Link>

            {/* Ratings & Material */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {ratingsAvg && (
                <div className="flex items-center gap-1 font-medium text-amber-600">
                  <span>★</span>
                  <span>{ratingsAvg.toFixed(1)}</span>
                  <span className="font-normal text-gray-400">({ratingsCount || 0})</span>
                </div>
              )}
              {material && (
                <span className="inline-flex items-center rounded border border-gray-200 bg-[#FAF9F6] px-2 py-0.5 text-[11px] text-gray-700">
                  {material}
                </span>
              )}
              {productType && (
                <span className="text-[11px] uppercase tracking-wider text-gray-500">
                  {productType === 'READY_TO_SHIP' ? 'Ready to Ship' : 'Made to Order'}
                </span>
              )}
            </div>

            {/* Finish swatches */}
            {finishes && finishes.length > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <span className="text-[11px]">Available Finishes:</span>
                <span className="text-[11px] font-medium text-gray-700">{finishes.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Pricing & Actions */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-[#171717]">{formattedPrice}</span>
              {formattedMrp && (
                <span className="text-sm text-gray-400 line-through">{formattedMrp}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-700 transition-colors hover:border-gray-900"
                >
                  Quick View
                </button>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className={`rounded px-5 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors ${
                  added ? 'bg-emerald-700' : 'bg-[#171717] hover:bg-black'
                }`}
              >
                {adding ? 'Adding...' : added ? '✓ Added' : 'Add to Bag'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Grid Card (Editorial 3-col or Compact 4-col)
  return (
    <div
      className="luxury-card-hover group relative flex flex-col rounded-md bg-transparent"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-[#F0EDE8] bg-[#FAF9F6] transition-all duration-500 group-hover:border-[#E07020]/40 group-hover:shadow-md">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage}
                alt={name}
                fill
                priority={priority}
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
                className={`object-cover transition-all duration-700 ease-out ${
                  isHovered && secondaryImage !== primaryImage
                    ? 'scale-100 opacity-0'
                    : 'group-hover:scale-106 opacity-100'
                }`}
              />
              {secondaryImage && secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${name} secondary view`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
                  className={`object-cover transition-all duration-700 ease-out ${
                    isHovered ? 'scale-106 opacity-100' : 'scale-100 opacity-0'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </Link>

        {/* Top Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col gap-1">
          {discountPercentage > 0 && (
            <span className="bg-[#171717] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
              -{discountPercentage}%
            </span>
          )}
          {isBestSeller && (
            <span className="border border-emerald-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-900 shadow-sm backdrop-blur-sm">
              Bestseller
            </span>
          )}
          {isFeatured && !isBestSeller && (
            <span className="border border-amber-200 bg-white/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-900 shadow-sm backdrop-blur-sm">
              Featured
            </span>
          )}
          {productType === 'MADE_TO_ORDER' && (
            <span className="border border-stone-200 bg-white/95 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-stone-800">
              Made to Order
            </span>
          )}
          {hasVideo && (
            <span className="backdrop-blur-xs shadow-xs inline-flex items-center gap-1 rounded bg-[#171717]/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
              <svg className="h-2.5 w-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Video</span>
            </span>
          )}
        </div>

        {/* Wishlist Button with Heart Pop Keyframe */}
        <button
          onClick={toggleWishlist}
          className="absolute right-2.5 top-2.5 z-20 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm transition-all duration-300 hover:scale-110 hover:bg-white hover:text-red-500 active:scale-90"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`h-4 w-4 transition-all duration-300 ${
              isWishlisted ? 'animate-heart-pop fill-red-500 text-red-500' : 'text-gray-600'
            }`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>

        {/* Bottom Hover Action Bar with Spring Slide-Up */}
        <div className="backdrop-blur-xs absolute inset-x-0 bottom-0 z-20 flex translate-y-3 gap-2 bg-gradient-to-t from-black/50 via-black/20 to-transparent p-2.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="flex-1 rounded border border-gray-200 bg-white/95 px-2 py-2 text-xs font-medium uppercase tracking-wider text-[#171717] shadow transition-all hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
            >
              Quick View
            </button>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`flex-1 rounded px-2 py-2 text-xs font-medium uppercase tracking-wider text-white shadow transition-all hover:scale-[1.02] active:scale-[0.98] ${
              added ? 'bg-emerald-700' : 'bg-[#171717] hover:bg-[#E07020]'
            }`}
          >
            {adding ? 'Adding...' : added ? '✓ Added' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col pb-1 pt-3.5">
        {/* Category & Rating Row */}
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="truncate font-medium uppercase tracking-widest text-[#8C7355]">
            {category}
          </span>
          {ratingsAvg && (
            <div className="flex shrink-0 items-center gap-1 font-medium text-amber-600">
              <span>★</span>
              <span>{ratingsAvg.toFixed(1)}</span>
              <span className="font-normal text-gray-400">({ratingsCount || 0})</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="line-clamp-1 font-serif text-sm font-normal leading-snug text-[#171717] transition-colors group-hover:text-[#B7791F]">
            {name}
          </h3>
        </Link>

        {/* Material snippet if available */}
        {material && <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500">{material}</p>}

        {/* Price Row */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-[#171717]">{formattedPrice}</span>
          {formattedMrp && (
            <span className="text-xs text-gray-400 line-through">{formattedMrp}</span>
          )}
        </div>

        {/* Finish Swatches Dots */}
        {finishes && finishes.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            {finishes.slice(0, 3).map((finish, i) => (
              <span
                key={i}
                title={finish}
                className="h-2.5 w-2.5 rounded-full border border-gray-300 bg-[#D4AF37]/30"
              />
            ))}
            {finishes.length > 3 && (
              <span className="ml-0.5 text-[10px] text-gray-400">+{finishes.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
