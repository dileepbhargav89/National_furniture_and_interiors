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

  const rawImages = (product.images && product.images.length > 0)
    ? product.images.map((img) => (typeof img === 'string' ? img : img.url))
    : [];

  const images = rawImages.filter(
    (url) =>
      typeof url === 'string' &&
      url.trim().length > 0 &&
      !url.includes('example.com') &&
      (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:'))
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

  const formattedMrp = mrpAmount && mrpAmount > priceAmount
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border border-[#E5E5E5] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-gray-500 hover:text-black bg-white/80 hover:bg-white rounded-full transition-colors border border-gray-200"
          aria-label="Close Quick View"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left: Gallery (Image or Video) */}
        <div className="w-full md:w-1/2 p-6 bg-[#FAF9F6] flex flex-col justify-between">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-white border border-gray-200">
            {selectedMediaType === 'video' && activeVideo ? (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  key={activeVideo.url}
                  src={activeVideo.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
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
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              {discountPercentage > 0 && (
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#171717] text-white shadow-xs">
                  -{discountPercentage}% OFF
                </span>
              )}
              {videos.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#171717]/90 text-white rounded shadow-xs backdrop-blur-xs">
                  <svg className="w-2.5 h-2.5 fill-current text-amber-400" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Video Included</span>
                </span>
              )}
              {product.productType === 'READY_TO_SHIP' && (
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-white text-emerald-800 border border-emerald-300 shadow-xs">
                  Ready to Ship
                </span>
              )}
              {product.productType === 'MADE_TO_ORDER' && (
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-white text-amber-900 border border-amber-300 shadow-xs">
                  Bespoke Made to Order
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails: Photos and Videos */}
          {(images.length > 1 || videos.length > 0) && (
            <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
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
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border flex flex-col items-center justify-center bg-zinc-900 text-white transition-all ${
                    selectedMediaType === 'video' && selectedMediaIndex === vIdx
                      ? 'border-[#CA8A04] ring-2 ring-[#CA8A04]'
                      : 'border-gray-300 opacity-80 hover:opacity-100'
                  }`}
                  title={vid.title || 'Play Demonstration Video'}
                  aria-label="Play product video"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                    <svg className="w-3.5 h-3.5 fill-current text-amber-400 ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-200">Video</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specifications & Commerce */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-amber-900 font-medium">
                  {product.brand || 'National Furniture'}
                </span>
                {product.sku && <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>}
              </div>
              <h2 id="quickview-title" className="mt-1 text-2xl font-serif text-[#171717] font-normal leading-snug">
                {product.name}
              </h2>

              {/* Ratings */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex text-amber-600 text-sm">
                  {'★'.repeat(Math.round(product.ratingsAvg || 5))}
                  <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.ratingsAvg || 5))}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {product.ratingsAvg ? product.ratingsAvg.toFixed(1) : '5.0'} ({product.ratingsCount || 12} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2 border-t border-gray-100">
              <span className="text-2xl font-semibold text-[#171717]">{formattedPrice}</span>
              {formattedMrp && <span className="text-base text-gray-400 line-through">{formattedMrp}</span>}
              <span className="text-xs text-gray-500">Incl. all taxes</span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {product.shortDescription || product.description}
            </p>

            {/* Specifications Pill Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100 bg-[#FAF9F6] p-3 rounded">
              {product.material && (
                <div>
                  <span className="text-gray-500 block font-normal">Primary Material:</span>
                  <span className="text-gray-900 font-medium">{product.material}</span>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <span className="text-gray-500 block font-normal">Dimensions:</span>
                  <span className="text-gray-900 font-medium">
                    {product.dimensions.length}×{product.dimensions.width}×{product.dimensions.height}{' '}
                    {product.dimensions.unit || 'cm'}
                  </span>
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="text-gray-500 block font-normal">Approx Weight:</span>
                  <span className="text-gray-900 font-medium">{product.weight} kg</span>
                </div>
              )}
              {(product.warranty?.summary || product.warranty?.terms) && (
                <div>
                  <span className="text-gray-500 block font-normal">Warranty:</span>
                  <span className="text-gray-900 font-medium">
                    {product.warranty.summary || `${product.warranty.durationMonths || ''} months ${product.warranty.terms || ''}`}
                  </span>
                </div>
              )}
            </div>

            {/* Finish Selection */}
            {product.finishes && product.finishes.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
                  Finish: <span className="text-gray-900 font-normal">{selectedFinish || product.finishes[0]}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.finishes.map((finish: string) => (
                    <button
                      key={finish}
                      type="button"
                      onClick={() => setSelectedFinish(finish)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border transition-all ${
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
              <label className="text-xs font-medium text-gray-700 uppercase tracking-wider">Quantity</label>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`flex-1 py-3 px-6 text-sm font-medium tracking-wider uppercase transition-all duration-200 rounded ${
                addedSuccess
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#171717] hover:bg-black text-white active:scale-[0.99]'
              }`}
            >
              {isAdding ? 'Adding...' : addedSuccess ? '✓ Added to Bag' : 'Add to Bag'}
            </button>
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="py-3 px-5 text-sm font-medium text-center tracking-wider uppercase text-gray-800 bg-white border border-gray-300 hover:border-gray-900 transition-colors rounded"
            >
              Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
