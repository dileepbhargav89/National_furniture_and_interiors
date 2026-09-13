'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CmsService, Banner, BannerPlacement } from '@nfi/api-client';
import { Sparkles, Tag, ArrowRight, X } from 'lucide-react';

export function AnnouncementBar() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const impressionRecorded = useRef<string | null>(null);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissedId = typeof window !== 'undefined' ? sessionStorage.getItem('nfi_dismissed_promo') : null;

    async function loadPromoBanner() {
      try {
        const response = await CmsService.getBanners({ placement: BannerPlacement.PROMO_STRIP });
        const activeBanners = (response.data || []).filter((b: Banner) => b.isActive);
        if (activeBanners.length > 0) {
          activeBanners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          const topPromo = activeBanners[0];
          if (topPromo && topPromo.id !== dismissedId) {
            setBanner(topPromo);

            // Record impression telemetry
            if (impressionRecorded.current !== topPromo.id) {
              impressionRecorded.current = topPromo.id;
              CmsService.trackBannerImpression(topPromo.id).catch(() => {});
            }
          }
        }
      } catch {
        // Silent catch for announcement bar
      }
    }

    loadPromoBanner();
  }, []);

  const handleDismiss = () => {
    if (banner) {
      sessionStorage.setItem('nfi_dismissed_promo', banner.id);
    }
    setIsDismissed(true);
  };

  const handleBannerClick = () => {
    if (banner) {
      CmsService.trackBannerClick(banner.id).catch(() => {});
    }
  };

  if (!banner || isDismissed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Promotional Announcement"
      className="relative z-50 text-white py-2 px-4 text-xs transition-all duration-300"
      style={{
        backgroundColor: 'var(--nfi-orange)',
        borderBottom: '1px solid rgba(93, 45, 16, 0.25)',
      }}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap">
          {banner.badgeText && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: 'rgba(61, 26, 8, 0.25)',
                color: '#FDF8F2',
                border: '1px solid rgba(253, 248, 242, 0.35)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {banner.badgeText}
            </span>
          )}

          <span className="font-semibold text-white">{banner.title}</span>

          {banner.discountCode && (
            <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] bg-emerald-950/70 text-emerald-400 border border-emerald-600/40 px-2 py-0.5 rounded">
              <Tag className="w-2.5 h-2.5" />
              CODE: {banner.discountCode}
            </span>
          )}

          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              onClick={handleBannerClick}
              className="inline-flex items-center gap-1 font-bold text-white/90 hover:text-white underline underline-offset-2 ml-1"
            >
              <span>{banner.ctaText || 'Learn More'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss Announcement"
          className="text-white/70 hover:text-white p-1 rounded transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
