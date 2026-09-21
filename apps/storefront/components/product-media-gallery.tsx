'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';

export interface MediaGalleryItem {
  type: 'image' | 'video';
  url: string;
  title?: string | undefined;
  altText?: string | undefined;
}

export interface ProductMediaGalleryProps {
  images: { url: string; altText?: string | undefined }[];
  videos?: { url: string; title?: string | undefined; publicId?: string | undefined }[] | undefined;
  productName: string;
  discountPercentage?: number | undefined;
  isBestseller?: boolean | undefined;
}

export function ProductMediaGallery({
  images,
  videos = [],
  productName,
  discountPercentage = 0,
  isBestseller = false,
}: ProductMediaGalleryProps) {
  // Combine videos and images into a single unified media playlist
  const mediaItems: MediaGalleryItem[] = useMemo(() => {
    const items: MediaGalleryItem[] = [];

    // Add primary photo first
    if (images.length > 0 && images[0]) {
      items.push({
        type: 'image',
        url: images[0].url,
        altText: images[0].altText || `${productName} - Primary Angle`,
      });
    }

    // Add video right after primary photo for maximum discovery & wow factor
    videos.forEach((vid) => {
      if (vid.url) {
        items.push({
          type: 'video',
          url: vid.url,
          title: vid.title || `${productName} Artisanal Video Tour`,
        });
      }
    });

    // Add remaining photos
    images.slice(1).forEach((img, idx) => {
      if (img.url) {
        items.push({
          type: 'image',
          url: img.url,
          altText: img.altText || `${productName} - Angle ${idx + 2}`,
        });
      }
    });

    if (items.length === 0) {
      items.push({
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
        altText: productName,
      });
    }

    return items;
  }, [images, videos, productName]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const activeMedia = mediaItems[activeIndex] || mediaItems[0];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Lightbox keyboard shortcuts (Escape to close, Arrow keys to navigate)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, mediaItems.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex select-none flex-col gap-4">
      {/* Main Showcase Stage */}
      <div
        className="shadow-xs group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#EBE8E3] bg-[#FAF9F6] sm:aspect-[1/1] lg:aspect-[4/5]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={activeMedia?.type === 'image' ? handleMouseMove : undefined}
      >
        {activeMedia?.type === 'video' ? (
          <div className="relative flex h-full w-full items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={activeMedia.url}
              controls
              autoPlay
              playsInline
              loop
              className="h-full w-full object-contain"
            />
            <div className="absolute right-4 top-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                HD Craft Video
              </span>
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full overflow-hidden">
            {activeMedia && (
              <Image
                src={activeMedia.url}
                alt={activeMedia.altText || productName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className={`object-cover object-center transition-transform duration-300 ease-out ${
                  isHovered ? 'scale-125' : 'scale-100'
                }`}
                style={
                  isHovered
                    ? {
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                      }
                    : undefined
                }
              />
            )}
          </div>
        )}

        {/* Top Badges */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-1.5">
          {discountPercentage > 0 && (
            <span className="rounded-md bg-[#171717] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
              Save {discountPercentage}%
            </span>
          )}
          {isBestseller && (
            <span className="rounded-md border border-emerald-200 bg-white/95 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-950 shadow-sm backdrop-blur-md">
              ★ Bestseller
            </span>
          )}
        </div>

        {/* Fullscreen Zoom Trigger Button */}
        {activeMedia?.type === 'image' && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-4 right-4 z-10 rounded-full bg-white/90 p-2.5 text-neutral-800 opacity-0 shadow-md backdrop-blur-md transition-all hover:scale-105 hover:bg-white focus:opacity-100 group-hover:opacity-100"
            aria-label="Expand photo lightbox"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Thumbnail Carousel Strip */}
      {mediaItems.length > 1 && (
        <div className="scrollbar-none flex items-center gap-3 overflow-x-auto pb-2">
          {mediaItems.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`View ${item.type === 'video' ? 'video' : 'photo'} ${idx + 1}`}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#FAF9F6] transition-all sm:h-24 sm:w-24 ${
                  isActive
                    ? 'scale-102 border-[#8C7355] shadow-md ring-2 ring-[#8C7355]/30'
                    : 'border-[#EBE8E3] opacity-75 hover:border-neutral-400 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="relative flex h-full w-full flex-col items-center justify-center bg-neutral-900 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/90 shadow-md">
                      <svg className="ml-0.5 h-4 w-4 fill-white" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      Video
                    </span>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Trust Micro-Row */}
      <div className="grid grid-cols-3 gap-2 border-t border-[#EBE8E3] pt-2 text-center text-[11px] text-neutral-600">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-[#FAF9F6] p-2">
          <span className="text-base">🛡️</span>
          <span className="font-medium text-neutral-900">10-Year Warranty</span>
          <span className="text-[10px] text-neutral-500">Structural Frame</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-[#FAF9F6] p-2">
          <span className="text-base">🚚</span>
          <span className="font-medium text-neutral-900">Free White-Glove</span>
          <span className="text-[10px] text-neutral-500">Delivery & Assembly</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-[#FAF9F6] p-2">
          <span className="text-base">🪵</span>
          <span className="font-medium text-neutral-900">Authentic Luxury</span>
          <span className="text-[10px] text-neutral-500">Kiln-Dried Hardwood</span>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && activeMedia?.type === 'image' && (
        <div
          role="dialog"
          aria-modal="true"
          className="animate-fadeIn fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-md"
        >
          {/* Close & Counter Header */}
          <div className="mb-3 flex w-full max-w-5xl items-center justify-between text-white">
            <span className="font-mono text-xs text-neutral-400">
              {activeIndex + 1} / {mediaItems.length} · {productName}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              aria-label="Close fullscreen"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Large Image Viewport */}
          <div className="relative flex h-[75vh] w-full max-w-5xl items-center justify-center">
            <Image
              src={activeMedia.url}
              alt={activeMedia.altText || productName}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Lightbox Navigation Buttons */}
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))
              }
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))
              }
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
