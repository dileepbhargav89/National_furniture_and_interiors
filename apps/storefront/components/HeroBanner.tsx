'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CmsService, Banner, BannerPlacement } from '@nfi/api-client';
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowUpRight } from 'lucide-react';

const FALLBACK_BANNER: Banner = {
  id: 'fallback-hero',
  title: 'Where Architectural Heritage Meets Modern Living.',
  subtitle: 'Bespoke solid wood craftsmanship, curated European upholstery, and turnkey interior design tailored to discerning Indian homes.',
  badgeText: 'EST. 1998 — BENGALURU & HYDERABAD',
  imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=85&w=2400&auto=format&fit=crop',
  mobileImageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=85&w=900&auto=format&fit=crop',
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
      className="relative h-[90vh] min-h-[660px] max-h-[960px] w-full flex items-end overflow-hidden select-none"
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
            <source
              media="(max-width: 768px)"
              srcSet={currentBanner.mobileImageUrl}
            />
          )}
          <img
            src={currentBanner.imageUrl || FALLBACK_BANNER.imageUrl}
            alt={currentBanner.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70 transition-opacity duration-1000"
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
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/60 via-transparent to-transparent hidden sm:block" />

      {/* Banner Content Container */}
      <div className="relative z-10 container mx-auto px-6 md:px-12 pb-16 sm:pb-24 text-white max-w-7xl">
        {/* Pre-title Badge Pill */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {currentBanner.badgeText ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.2em] uppercase backdrop-blur-md transition-all shadow-sm"
              style={{
                backgroundColor: 'rgba(224, 112, 32, 0.22)',
                color: '#F5A060',
                border: '1px solid rgba(224, 112, 32, 0.5)',
              }}
            >
              <Sparkles className="w-3 h-3" style={{ color: 'var(--nfi-orange)' }} />
              {currentBanner.badgeText}
            </span>
          ) : (
            <span className="text-[11px] tracking-[0.25em] text-gray-300 uppercase font-medium">
              National Furniture & Interiors — Est. 1998
            </span>
          )}

          {currentBanner.discountCode && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 backdrop-blur-md">
              <Tag className="w-3 h-3 text-emerald-400" />
              PRIVILEGE CODE: {currentBanner.discountCode}
            </span>
          )}
        </div>

        {/* Dynamic Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight leading-[1.08] mb-4 max-w-4xl drop-shadow-md">
          {currentBanner.title.split('\\n').map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </h1>

        {/* Editorial Subtitle */}
        {currentBanner.subtitle && (
          <p className="text-sm sm:text-base md:text-lg text-gray-200/90 font-light max-w-2xl mb-8 leading-relaxed line-clamp-2 sm:line-clamp-none">
            {currentBanner.subtitle}
          </p>
        )}

        {/* Dual Conversion CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-lg">
          <Link
            href={currentBanner.linkUrl || '/products'}
            onClick={() => handleCtaClick(currentBanner.id)}
            className="flex-1"
          >
            <button
              className="w-full px-7 py-3.5 text-white text-xs sm:text-sm uppercase tracking-widest font-bold transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 shadow-2xl active:scale-95 flex items-center justify-center gap-2 rounded-none"
              style={{ backgroundColor: 'var(--nfi-orange)' }}
            >
              <span>{currentBanner.ctaText || 'Explore Collection'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>

          {currentBanner.secondaryCtaText && (
            <Link
              href={currentBanner.secondaryLinkUrl || '#design-consultation'}
              onClick={() => handleCtaClick(currentBanner.id)}
              className="flex-1"
            >
              <button className="w-full px-7 py-3.5 border border-white/80 text-white text-xs sm:text-sm uppercase tracking-widest font-semibold hover:bg-white/15 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 rounded-none">
                {currentBanner.secondaryCtaText}
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Carousel Navigation Controls (Visible if > 1 banner) */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 right-8 sm:right-12 z-20 flex items-center gap-3">
          <div className="flex items-center gap-1.5 mr-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              style={idx === currentIndex ? { backgroundColor: 'var(--nfi-orange)', width: '2rem' } : {}}
              />
            ))}
          </div>

          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="w-10 h-10 rounded-full border border-white/30 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="w-10 h-10 rounded-full border border-white/30 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </section>
  );
}
