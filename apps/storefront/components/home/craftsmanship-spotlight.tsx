'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';

export function CraftsmanshipSpotlight() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section className="bg-[#171717] text-white py-14 sm:py-18 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Playable Workshop Video Reel */}
          <div className="lg:col-span-7 relative">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black shadow-2xl">
              <video
                ref={videoRef}
                src="https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-42777-large.mp4"
                poster="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />

              {/* Video Overlay Badges & Controls */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-xs text-[10px] font-semibold tracking-wider uppercase text-amber-400 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Workshop Reel
                </span>
                <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-xs text-[10px] text-gray-300">
                  Bengaluru Master Atelier
                </span>
              </div>

              {/* Bottom Video Controls */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-colors border border-white/20"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-xs transition-colors border border-white/20"
                  aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                >
                  {isMuted ? (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative & Craftsmanship Pillars */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C7355] font-semibold mb-1.5">
                Artisanal Integrity — Since 1998
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal tracking-tight text-white leading-tight">
                Built by Hand. <br className="hidden sm:block" />
                Preserved for Generations.
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Every curve, mortise joint, and stitch is created in our proprietary master atelier. We never compromise with synthetic veneers or mass-market particle board.
            </p>

            {/* 3 Value Markers */}
            <div className="space-y-3 pt-1 border-t border-white/10">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-900/40 text-amber-300 flex items-center justify-center text-xs font-serif shrink-0 border border-amber-600/30">
                  1
                </span>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-medium text-white">Seasoned Kiln-Dried Teak</h4>
                  <p className="text-[11px] text-gray-400">Moisture-regulated to 8–10% to prevent warping and cracking across Indian seasons.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-900/40 text-amber-300 flex items-center justify-center text-xs font-serif shrink-0 border border-amber-600/30">
                  2
                </span>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-medium text-white">Interlocking Mortise & Tenon</h4>
                  <p className="text-[11px] text-gray-400">Structural integrity engineered without mechanical screws or fragile adhesives.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-900/40 text-amber-300 flex items-center justify-center text-xs font-serif shrink-0 border border-amber-600/30">
                  3
                </span>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-medium text-white">Full-Grain Italian Leather</h4>
                  <p className="text-[11px] text-gray-400">Supple, breathable, and develops a rich heirloom patina over decades.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/products?material=Solid+Teak+Wood">
                <button className="px-6 py-2.5 rounded bg-white hover:bg-gray-100 text-[#171717] text-xs font-medium uppercase tracking-wider transition-all hover:shadow-lg">
                  Explore Handcrafted Teak
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
