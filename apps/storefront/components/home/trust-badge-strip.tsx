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
    icon: <ShieldCheck className="w-5 h-5 text-[#8C7355]" />,
  },
  {
    title: 'Free White-Glove In-Home Setup',
    subtitle: 'Placement, assembly & debris cleanup',
    icon: <Truck className="w-5 h-5 text-[#8C7355]" />,
  },
  {
    title: '0% No-Cost EMI Available',
    subtitle: 'Flexible plans starting ₹4,750/month',
    icon: <CreditCard className="w-5 h-5 text-[#8C7355]" />,
  },
  {
    title: 'Direct Master Atelier Value',
    subtitle: 'Zero middleman markup · Factory direct',
    icon: <Sparkles className="w-5 h-5 text-[#8C7355]" />,
  },
];

export function TrustBadgeStrip() {
  return (
    <section className="bg-[#FAF9F6] border-y border-[#EBE8E3] py-4 sm:py-5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y md:divide-y-0 md:divide-x divide-[#E5E0D8]">
          {TRUST_PILLARS.map((pillar, idx) => (
            <div
              key={pillar.title}
              className={`flex items-center gap-3.5 pt-3 md:pt-0 ${idx > 0 ? 'md:pl-6' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E0D8] flex items-center justify-center shrink-0 shadow-2xs">
                {pillar.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-[13px] font-semibold text-[#171717] tracking-tight truncate">
                  {pillar.title}
                </h4>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {pillar.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
