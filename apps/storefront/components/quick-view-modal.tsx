'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@nfi/api-client';
import { useCart } from '../context/cart-context';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>('image');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setSelectedMediaType('image');
      setSelectedMediaIndex(0);
      setQuantity(1);
      setAddedSuccess(false);
      if (product.finishes && product.finishes.length > 0 && product.finishes[0]) {
        setSelectedFinish(product.finishes[0]);
      } else {
        setSelectedFinish('');
      }
    }
  }, [product]);

  // Handle escape key and body scroll lock
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) return null;

  const rawImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => (typeof img === 'string' ? img : img.url))
      : [];

  const images = rawImages.filter(
    (url) =>
      typeof url === 'string' &&
      url.trim().length > 0 &&
      !url.includes('example.com') &&
      (url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('/') ||
        url.startsWith('data:')),
  );

  const videos = Array.isArray(product.videos)
    ? product.videos.filter((v) => v && typeof v.url === 'string' && v.url.trim().length > 0)
    : [];

  const activeImage = images[selectedMediaIndex] || images[0];
  const activeVideo = videos[selectedMediaIndex] || videos[0];

  const priceAmount = product.basePrice?.amount ?? 0;
  const currency = product.basePrice?.currency || 'INR';
  const mrpAmount = product.mrp?.amount;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceAmount / 100);

  const formattedMrp =
    mrpAmount && mrpAmount > priceAmount
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(mrpAmount / 100)
      : null;

  const discountPercentage =
    mrpAmount && mrpAmount > priceAmount
      ? Math.round(((mrpAmount - priceAmount) / mrpAmount) * 100)
      : 0;

  const handleAddToCart = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      await addItem({
        productId: product.id,
        variantId: product.variants?.[0]?.variantId || `${product.id}-var-1`,
        quantity,
      });
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity sm:p-6 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="animate-scale-subtle relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white shadow-2xl md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-gray-200 bg-white/80 p-2 text-gray-500 transition-colors hover:bg-white hover:text-black"
          aria-label="Close Quick View"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left: Gallery (Image or Video) */}
        <div className="flex w-full flex-col justify-between bg-[#FAF9F6] p-6 md:w-1/2">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-gray-200 bg-white">
            {selectedMediaType === 'video' && activeVideo ? (
              <div className="relative flex h-full w-full items-center justify-center bg-black">
                <video
                  key={activeVideo.url}
                  src={activeVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                >
                  Your browser does not support HTML5 video.
                </video>
              </div>
            ) : activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-cover object-center transition-all duration-300"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <span>No media available</span>
              </div>
            )}

            {/* Badges */}
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
              {discountPercentage > 0 && (
                <span className="shadow-xs bg-[#171717] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  -{discountPercentage}% OFF
                </span>
              )}
              {videos.length > 0 && (
                <span className="shadow-xs backdrop-blur-xs inline-flex items-center gap-1 rounded bg-[#171717]/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  <svg className="h-2.5 w-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Video Included</span>
                </span>
              )}
              {product.productType === 'READY_TO_SHIP' && (
                <span className="shadow-xs border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800">
                  Ready to Ship
                </span>
              )}
              {product.productType === 'MADE_TO_ORDER' && (
                <span className="shadow-xs border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-900">
                  Bespoke Made to Order
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails: Photos and Videos */}
          {(images.length > 1 || videos.length > 0) && (
            <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`img-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('image');
                    setSelectedMediaIndex(idx);
                  }}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border transition-all ${
                    selectedMediaType === 'image' && selectedMediaIndex === idx
                      ? 'border-[#171717] ring-2 ring-[#171717]'
                      : 'border-gray-200 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Photo ${idx + 1}`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}

              {videos.map((vid, vIdx) => (
                <button
                  key={`vid-${vIdx}`}
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('video');
                    setSelectedMediaIndex(vIdx);
                  }}
                  className={`relative flex h-16 w-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded border bg-zinc-900 text-white transition-all ${
                    selectedMediaType === 'video' && selectedMediaIndex === vIdx
                      ? 'border-[#CA8A04] ring-2 ring-[#CA8A04]'
                      : 'border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                  title={vid.title || 'Play Demonstration Video'}
                  aria-label="Play product video"
                >
                  <div className="mb-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                    <svg
                      className="ml-0.5 h-3.5 w-3.5 fill-current text-amber-400"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200">
                    Video
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications & Commerce */}
        <div className="flex w-full flex-col justify-between overflow-y-auto p-6 md:w-1/2 md:p-8">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-amber-900">
                  {product.brand || 'National Furniture'}
                </span>
                {product.sku && (
                  <span className="font-mono text-xs text-gray-400">SKU: {product.sku}</span>
                )}
              </div>
              <h2
                id="quickview-title"
                className="mt-1 font-serif text-2xl font-normal leading-snug text-[#171717]"
              >
                {product.name}
              </h2>

              {/* Ratings */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex text-sm text-amber-600">
                  {'★'.repeat(Math.round(product.ratingsAvg || 5))}
                  <span className="text-gray-300">
                    {'★'.repeat(5 - Math.round(product.ratingsAvg || 5))}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {product.ratingsAvg ? product.ratingsAvg.toFixed(1) : '5.0'} (
                  {product.ratingsCount || 12} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-t border-gray-100 pt-2">
              <span className="text-2xl font-semibold text-[#171717]">{formattedPrice}</span>
              {formattedMrp && (
                <span className="text-base text-gray-400 line-through">{formattedMrp}</span>
              )}
              <span className="text-xs text-gray-500">Incl. all taxes</span>
            </div>

            {/* Description */}
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
              {product.shortDescription || product.description}
            </p>

            {/* Specifications Pill Grid */}
            <div className="grid grid-cols-2 gap-2 rounded border-y border-gray-100 bg-[#FAF9F6] p-3 py-2 text-xs">
              {product.material && (
                <div>
                  <span className="block font-normal text-gray-500">Primary Material:</span>
                  <span className="font-medium text-gray-900">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="block font-normal text-gray-500">Dimensions:</span>
                  <span className="font-medium text-gray-900">
                    {product.dimensions.length}×{product.dimensions.width}×
                    {product.dimensions.height} {product.dimensions.unit || 'cm'}
                  </span>
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="block font-normal text-gray-500">Approx Weight:</span>
                  <span className="font-medium text-gray-900">{product.weight} kg</span>
                </div>
              )}
              {(product.warranty?.summary || product.warranty?.terms) && (
                <div>
                  <span className="block font-normal text-gray-500">Warranty:</span>
                  <span className="font-medium text-gray-900">
                    {product.warranty.summary ||
                      `${product.warranty.durationMonths || ''} months ${product.warranty.terms || ''}`}
                  </span>
                </div>
              )}
            </div>

            {/* Finish Selection */}
            {product.finishes && product.finishes.length > 0 && (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-700">
                  Finish:{' '}
                  <span className="font-normal text-gray-900">
                    {selectedFinish || product.finishes[0]}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.finishes.map((finish: string) => (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => setSelectedFinish(finish)}
                      className={`rounded border px-3 py-1.5 text-xs font-medium transition-all ${
                        selectedFinish === finish
                          ? 'border-[#171717] bg-[#171717] text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 pt-1">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-700">
                Quantity
              </label>
              <div className="flex items-center overflow-hidden rounded border border-gray-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-gray-50 px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="bg-gray-50 px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`btn-shimmer-wrap flex-1 rounded px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-300 ${
                addedSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#171717] text-white hover:bg-[#E07020] active:scale-[0.99]'
              }`}
            >
              {isAdding ? 'Adding...' : addedSuccess ? '✓ Added to Bag' : 'Add to Bag'}
            </button>
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="rounded border border-gray-300 bg-white px-5 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-800 transition-colors hover:border-gray-900"
            >
              Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
