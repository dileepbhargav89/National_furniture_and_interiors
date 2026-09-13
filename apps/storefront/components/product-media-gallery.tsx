'use client';

import React, { useState, useRef, useMemo } from 'react';
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Main Showcase Stage */}
      <div
        className="relative aspect-[4/3] sm:aspect-[1/1] lg:aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#FAF9F6] border border-[#EBE8E3] shadow-xs group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={activeMedia?.type === 'image' ? handleMouseMove : undefined}
      >
        {activeMedia?.type === 'video' ? (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={activeMedia.url}
              controls
              autoPlay
              playsInline
              loop
              className="w-full h-full object-contain"
            />
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-black/70 text-white backdrop-blur-md border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                HD Craft Video
              </span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
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
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          {discountPercentage > 0 && (
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-[#171717] text-white rounded-md shadow-sm">
              Save {discountPercentage}%
            </span>
          )}
          {isBestseller && (
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider bg-white/95 text-emerald-950 backdrop-blur-md rounded-md border border-emerald-200 shadow-sm">
              ★ Bestseller
            </span>
          )}
        </div>

        {/* Fullscreen Zoom Trigger Button */}
        {activeMedia?.type === 'image' && (
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-4 right-4 z-10 p-2.5 rounded-full bg-white/90 text-neutral-800 shadow-md backdrop-blur-md hover:bg-white hover:scale-105 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Expand photo lightbox"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {mediaItems.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-[#FAF9F6] border-2 transition-all ${
                  isActive
                    ? 'border-[#8C7355] ring-2 ring-[#8C7355]/30 shadow-md scale-102'
                    : 'border-[#EBE8E3] hover:border-neutral-400 opacity-75 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="relative w-full h-full bg-neutral-900 flex flex-col items-center justify-center text-white">
                    <div className="w-8 h-8 rounded-full bg-amber-600/90 flex items-center justify-center shadow-md">
                      <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-amber-300">
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
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EBE8E3] text-center text-[11px] text-neutral-600">
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#FAF9F6]">
          <span className="text-base">🛡️</span>
          <span className="font-medium text-neutral-900">10-Year Warranty</span>
          <span className="text-[10px] text-neutral-500">Structural Frame</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#FAF9F6]">
          <span className="text-base">🚚</span>
          <span className="font-medium text-neutral-900">Free White-Glove</span>
          <span className="text-[10px] text-neutral-500">Delivery & Assembly</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#FAF9F6]">
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
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
        >
          {/* Close & Counter Header */}
          <div className="w-full max-w-5xl flex items-center justify-between text-white mb-3">
            <span className="text-xs font-mono text-neutral-400">
              {activeIndex + 1} / {mediaItems.length} · {productName}
            </span>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Large Image Viewport */}
          <div className="relative w-full max-w-5xl h-[75vh] flex items-center justify-center">
            <Image
              src={activeMedia.url}
              alt={activeMedia.altText || productName}
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Lightbox Navigation Buttons */}
          <div className="flex items-center gap-4 mt-4">
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))
              }
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))
              }
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
