'use client';

import Link from 'next/link';

interface ArticleConsultationCtaProps {
  storyTitle?: string;
  projectLocality?: string;
}

export function ArticleConsultationCta({
  storyTitle,
  projectLocality = 'Bengaluru',
}: ArticleConsultationCtaProps) {
  return (
    <div className="my-14 relative overflow-hidden rounded-2xl bg-[#171717] text-white p-8 md:p-12 border border-[#C5A059]/40 shadow-xl">
      {/* Subtle luxury ambient pattern */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 rounded-full bg-[#8C7355]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#C5A059] font-medium mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
          Bespoke Spatial Commissions
        </span>

        <h3 className="text-2xl md:text-3xl font-serif font-light text-[#FAF9F6] leading-snug">
          Inspired by {storyTitle ? `“${storyTitle}”` : 'this aesthetic'} for your {projectLocality} residence?
        </h3>

        <p className="mt-3 text-sm md:text-base text-stone-300 font-light leading-relaxed">
          Our principal spatial architects and master joiners craft turnkey residential sanctuaries tailored to your property’s floor plate, natural light, and lifestyle.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Link
            href="/design-services"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-[#C5A059] hover:bg-[#b08e4a] text-[#171717] font-medium text-sm tracking-wide rounded-md transition-all shadow-md hover:shadow-lg"
          >
            Commission a Private Consultation
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium text-sm tracking-wide rounded-md border border-white/20 transition-colors"
          >
            Visit Indiranagar Flagship Studio
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-6 text-xs text-stone-400 font-light">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Dedicated Lead Architect
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Full 3D Spatial Walkthrough
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            10-Year Timber Warranty
          </span>
        </div>
      </div>
    </div>
  );
}
