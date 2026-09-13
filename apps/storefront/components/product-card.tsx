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

  const discountPercentage =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

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
        className="group relative flex flex-col sm:flex-row gap-6 p-4 rounded-lg bg-white border border-[#EBE8E3] hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Thumbnail */}
        <Link href={`/products/${slug}`} className="relative w-full sm:w-60 h-64 shrink-0 overflow-hidden rounded bg-[#FAF9F6]">
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
                    isHovered ? 'opacity-100 scale-105' : 'opacity-0'
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
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discountPercentage > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#171717] text-white">
                -{discountPercentage}%
              </span>
            )}
            {hasVideo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#171717]/90 text-white backdrop-blur-xs rounded shadow-xs">
                <svg className="w-2.5 h-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
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
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#8C7355]">{category}</span>
              <button
                onClick={toggleWishlist}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            <Link href={`/products/${slug}`}>
              <h3 className="mt-1 text-lg font-serif font-normal text-[#171717] group-hover:text-[#B7791F] transition-colors">
                {name}
              </h3>
            </Link>

            {/* Ratings & Material */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {ratingsAvg && (
                <div className="flex items-center gap-1 text-amber-600 font-medium">
                  <span>★</span>
                  <span>{ratingsAvg.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({ratingsCount || 0})</span>
                </div>
              )}
              {material && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#FAF9F6] text-gray-700 border border-gray-200">
                  {material}
                </span>
              )}
              {productType && (
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">
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
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-[#171717]">{formattedPrice}</span>
              {formattedMrp && <span className="text-sm text-gray-400 line-through">{formattedMrp}</span>}
            </div>

            <div className="flex items-center gap-2">
              {onQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewClick}
                  className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-700 bg-white border border-gray-300 hover:border-gray-900 rounded transition-colors"
                >
                  Quick View
                </button>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding}
                className={`px-5 py-2 text-xs font-medium uppercase tracking-wider text-white rounded transition-colors ${
                  added
                    ? 'bg-emerald-700'
                    : 'bg-[#171717] hover:bg-black'
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
      className="group relative flex flex-col bg-transparent transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#FAF9F6] border border-[#F0EDE8] transition-all duration-300 group-hover:border-[#D4AF37]/40 group-hover:shadow-lg">
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
                    ? 'opacity-0 scale-100'
                    : 'opacity-100 group-hover:scale-105'
                }`}
              />
              {secondaryImage && secondaryImage !== primaryImage && (
                <Image
                  src={secondaryImage}
                  alt={`${name} secondary view`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
                  className={`object-cover transition-all duration-700 ease-out ${
                    isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {discountPercentage > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#171717] text-white shadow-sm">
              -{discountPercentage}%
            </span>
          )}
          {isBestSeller && (
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-white/95 backdrop-blur-sm text-emerald-900 border border-emerald-200 shadow-sm">
              Bestseller
            </span>
          )}
          {isFeatured && !isBestSeller && (
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-white/95 backdrop-blur-sm text-amber-900 border border-amber-200 shadow-sm">
              Featured
            </span>
          )}
          {productType === 'MADE_TO_ORDER' && (
            <span className="px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider bg-white/95 text-stone-800 border border-stone-200">
              Made to Order
            </span>
          )}
          {hasVideo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#171717]/90 text-white backdrop-blur-xs rounded shadow-xs">
              <svg className="w-2.5 h-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Video</span>
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 rounded-full shadow-sm transition-all duration-200 z-20"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`w-4 h-4 transition-transform active:scale-125 ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
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

        {/* Bottom Hover Action Bar */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-20 flex gap-2">
          {onQuickView && (
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="flex-1 py-2 px-2 text-xs font-medium tracking-wider uppercase bg-white/95 hover:bg-white text-[#171717] border border-gray-200 rounded shadow transition-colors active:scale-[0.98]"
            >
              Quick View
            </button>
          )}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`flex-1 py-2 px-2 text-xs font-medium tracking-wider uppercase text-white rounded shadow transition-all active:scale-[0.98] ${
              added ? 'bg-emerald-700' : 'bg-[#171717] hover:bg-black'
            }`}
          >
            {adding ? 'Adding...' : added ? '✓ Added' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="pt-3.5 pb-1 flex flex-col flex-1">
        {/* Category & Rating Row */}
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="uppercase tracking-widest text-[#8C7355] font-medium truncate">{category}</span>
          {ratingsAvg && (
            <div className="flex items-center gap-1 text-amber-600 font-medium shrink-0">
              <span>★</span>
              <span>{ratingsAvg.toFixed(1)}</span>
              <span className="text-gray-400 font-normal">({ratingsCount || 0})</span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="text-sm font-serif font-normal text-[#171717] group-hover:text-[#B7791F] transition-colors line-clamp-1 leading-snug">
            {name}
          </h3>
        </Link>

        {/* Material snippet if available */}
        {material && (
          <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{material}</p>
        )}

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
                className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-[#D4AF37]/30"
              />
            ))}
            {finishes.length > 3 && (
              <span className="text-[10px] text-gray-400 ml-0.5">+{finishes.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
