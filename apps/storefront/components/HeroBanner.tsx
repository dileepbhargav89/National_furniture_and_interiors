'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CmsService, Banner, BannerPlacement } from '@nfi/api-client';
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowUpRight } from 'lucide-react';

const FALLBACK_BANNER: Banner = {
  id: 'fallback-hero',
  title: 'Where Architectural Heritage Meets Modern Living.',
  subtitle:
    'Bespoke solid wood craftsmanship, curated European upholstery, and turnkey interior design tailored to discerning Indian homes.',
  badgeText: 'EST. 1998 — BENGALURU & HYDERABAD',
  imageUrl:
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=85&w=2400&auto=format&fit=crop',
  mobileImageUrl:
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=85&w=900&auto=format&fit=crop',
  linkUrl: '/products',
  ctaText: 'Explore Signature Collections',
  secondaryCtaText: 'Book Design Consultation',
  secondaryLinkUrl: '#design-consultation',
  placement: BannerPlacement.HOMEPAGE_HERO,
  discountCode: 'PRIVILEGE15',
  sortOrder: 0,
  isActive: true,
  impressionCount: 0,
  clickCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([FALLBACK_BANNER]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackedImpressions = useRef<Set<string>>(new Set());

  // Fetch active hero banners
  useEffect(() => {
    async function loadHeroBanners() {
      try {
        const response = await CmsService.getBanners({ placement: BannerPlacement.HOMEPAGE_HERO });
        const activeBanners = (response.data || []).filter((b: Banner) => b.isActive);
        if (activeBanners.length > 0) {
          activeBanners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          setBanners(activeBanners);
        }
      } catch (err) {
        console.warn('HeroBanner: Using default luxury banner fallback.', err);
      }
    }
    loadHeroBanners();
  }, []);

  // Track impression for current active banner
  useEffect(() => {
    const currentBanner = banners[currentIndex];
    if (currentBanner && currentBanner.id !== 'fallback-hero') {
      if (!trackedImpressions.current.has(currentBanner.id)) {
        trackedImpressions.current.add(currentBanner.id);
        CmsService.trackBannerImpression(currentBanner.id).catch(() => {});
      }
    }
  }, [banners, currentIndex]);

  // Next / Prev slide handlers
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance if multiple banners exist
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(handleNext, 7500);
    return () => clearInterval(interval);
  }, [banners.length, isPaused, handleNext]);

  // Track CTA click
  const handleCtaClick = (bannerId: string) => {
    if (bannerId !== 'fallback-hero') {
      CmsService.trackBannerClick(bannerId).catch(() => {});
    }
  };

  const currentBanner = banners[currentIndex] || FALLBACK_BANNER;

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative flex h-[90vh] max-h-[960px] min-h-[660px] w-full select-none items-end overflow-hidden"
      style={{ backgroundColor: 'var(--nfi-brown-dark)' }}
      aria-roledescription="carousel"
      aria-label="Highlighted Collections"
    >
      {/* Background Media with Responsive Art Direction + Brand Fallback */}
      <div className="absolute inset-0 z-0">
        {/* Brand-color fallback layer — shows when image hasn't loaded yet */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #3D1A08 0%, #2A1005 50%, #1A0A03 100%)' }}
        />
        <picture>
          {currentBanner.mobileImageUrl && (
            <source media="(max-width: 768px)" srcSet={currentBanner.mobileImageUrl} />
          )}
          <img
            key={currentBanner.id}
            src={currentBanner.imageUrl || FALLBACK_BANNER.imageUrl}
            alt={currentBanner.title}
            className="animate-ken-burns absolute inset-0 h-full w-full object-cover object-center opacity-70 transition-opacity duration-1000"
            loading="eager"
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== FALLBACK_BANNER.imageUrl) {
                img.src = FALLBACK_BANNER.imageUrl;
              }
            }}
          />
        </picture>
      </div>

      {/* Luxury Gradient Vignette Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 z-0 hidden bg-gradient-to-r from-black/60 via-transparent to-transparent sm:block" />

      {/* Banner Content Container with Staggered Keyframe Entrance */}
      <div
        key={`content-${currentIndex}`}
        className="container relative z-10 mx-auto max-w-7xl px-6 pb-16 text-white sm:pb-24 md:px-12"
      >
        {/* Pre-title Badge Pill */}
        <div className="animate-reveal-up mb-4 flex flex-wrap items-center gap-3">
          {currentBanner.badgeText ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm backdrop-blur-md transition-all"
              style={{
                backgroundColor: 'rgba(224, 112, 32, 0.22)',
                color: '#F5A060',
                border: '1px solid rgba(224, 112, 32, 0.5)',
              }}
            >
              <Sparkles className="h-3 w-3 animate-pulse" style={{ color: 'var(--nfi-orange)' }} />
              {currentBanner.badgeText}
            </span>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-gray-300">
              National Furniture & Interiors — Est. 1998
            </span>
          )}

          {currentBanner.discountCode && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/80 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400 backdrop-blur-md">
              <Tag className="h-3 w-3 text-emerald-400" />
              PRIVILEGE CODE: {currentBanner.discountCode}
            </span>
          )}
        </div>

        {/* Dynamic Headline with Staggered Reveal */}
        <h1
          className="animate-reveal-up mb-4 max-w-4xl font-serif text-3xl font-light leading-[1.08] tracking-tight drop-shadow-md sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ animationDelay: '120ms' }}
        >
          {currentBanner.title.split('\\n').map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </h1>

        {/* Editorial Subtitle with Staggered Reveal */}
        {currentBanner.subtitle && (
          <p
            className="animate-reveal-up mb-8 line-clamp-2 max-w-2xl text-sm font-light leading-relaxed text-gray-200/90 sm:line-clamp-none sm:text-base md:text-lg"
            style={{ animationDelay: '240ms' }}
          >
            {currentBanner.subtitle}
          </p>
        )}

        {/* Dual Conversion CTAs with Shimmer Sweep */}
        <div
          className="animate-reveal-up flex max-w-lg flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
          style={{ animationDelay: '360ms' }}
        >
          <Link
            href={currentBanner.linkUrl || '/products'}
            onClick={() => handleCtaClick(currentBanner.id)}
            className="flex-1"
          >
            <button
              className="btn-shimmer-wrap group flex w-full items-center justify-center gap-2 rounded-none px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:brightness-110 active:scale-95 sm:text-sm"
              style={{ backgroundColor: 'var(--nfi-orange)' }}
            >
              <span>{currentBanner.ctaText || 'Explore Collection'}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </Link>

          {currentBanner.secondaryCtaText && (
            <Link
              href={currentBanner.secondaryLinkUrl || '#design-consultation'}
              onClick={() => handleCtaClick(currentBanner.id)}
              className="flex-1"
            >
              <button className="w-full rounded-none border border-white/80 px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 active:scale-95 sm:text-sm">
                {currentBanner.secondaryCtaText}
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Carousel Navigation Controls (Visible if > 1 banner) */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3 sm:right-12">
          <div className="mr-2 flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                style={
                  idx === currentIndex
                    ? { backgroundColor: 'var(--nfi-orange)', width: '2rem' }
                    : {}
                }
              />
            ))}
          </div>

          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
