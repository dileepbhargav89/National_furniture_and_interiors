'use client';

import React from 'react';
import { ShieldCheck, Truck, CreditCard, Sparkles } from 'lucide-react';

interface TrustPillar {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const TRUST_PILLARS: TrustPillar[] = [
  {
    title: '10-Year Structural Warranty',
    subtitle: 'Kiln-dried Burma teak & hardwood',
    icon: <ShieldCheck className="h-5 w-5 text-[#8C7355]" />,
  },
  {
    title: 'Free White-Glove In-Home Setup',
    subtitle: 'Placement, assembly & debris cleanup',
    icon: <Truck className="h-5 w-5 text-[#8C7355]" />,
  },
  {
    title: '0% No-Cost EMI Available',
    subtitle: 'Flexible plans starting ₹4,750/month',
    icon: <CreditCard className="h-5 w-5 text-[#8C7355]" />,
  },
  {
    title: 'Direct Master Atelier Value',
    subtitle: 'Zero middleman markup · Factory direct',
    icon: <Sparkles className="h-5 w-5 text-[#8C7355]" />,
  },
];

import { useScrollReveal } from '../../hooks/use-scroll-reveal';

export function TrustBadgeStrip() {
  const { ref, isRevealed } = useScrollReveal<HTMLElement>({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      className={`reveal-on-scroll border-y border-[#EBE8E3] bg-[#FAF9F6] py-4 sm:py-5 ${
        isRevealed ? 'is-revealed' : ''
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 divide-y divide-[#E5E0D8] sm:gap-6 md:grid-cols-4 md:divide-x md:divide-y-0">
          {TRUST_PILLARS.map((pillar, idx) => (
            <div
              key={pillar.title}
              className={`group flex items-center gap-3.5 pt-3 md:pt-0 ${idx > 0 ? 'md:pl-6' : ''}`}
            >
              <div className="shadow-2xs flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E0D8] bg-white transition-all duration-300 group-hover:scale-110 group-hover:border-[#E07020]/40 group-hover:shadow-md">
                {pillar.icon}
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-xs font-semibold tracking-tight text-[#171717] transition-colors duration-300 group-hover:text-[#E07020] sm:text-[13px]">
                  {pillar.title}
                </h4>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">{pillar.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
