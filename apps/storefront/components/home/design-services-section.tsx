'use client';

import React from 'react';
import Image from 'next/image';
import { LeadForm } from '../lead-form';

const DESIGN_STEPS = [
  {
    step: '01',
    title: 'Consultation & Site Audit',
    desc: 'Our principal architects visit your home to analyze natural light, circulation, and lifestyle priorities.',
  },
  {
    step: '02',
    title: '3D Photorealistic Design',
    desc: 'Explore your customized layout with high-definition 3D renders, material swatches, and fixed budgets.',
  },
  {
    step: '03',
    title: '45-Day Handover',
    desc: 'Precision manufacturing in our atelier, white-glove assembly, and deep clean before you move in.',
  },
];

export function DesignServicesSection() {
  return (
    <section id="design-consultation" className="py-16 sm:py-20 bg-[#FAF9F6] border-t border-[#EBE8E3]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#8C7355] font-semibold mb-2">
            Turnkey Residential & Commercial
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[#171717] tracking-tight">
            Complete Interior Architecture
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2.5 leading-relaxed">
            From bare-shell villas to modern apartments, our design studio blends bespoke teak craftsmanship with smart spatial engineering.
          </p>
        </div>

        {/* 3-Step Process Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {DESIGN_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white p-5 sm:p-6 rounded-lg border border-[#E5E0D8] shadow-2xs relative hover:border-[#8C7355] transition-colors"
            >
              <span className="text-2xl font-serif font-bold text-[#8C7355]/30 block mb-2">
                {item.step}
              </span>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Split Grid: Interior Visual Showcase + Compact Lead Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Architectural Photo Showcase */}
          <div className="lg:col-span-6 relative rounded-lg overflow-hidden min-h-[380px] lg:min-h-[460px] border border-[#E5E0D8]">
            <Image
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop"
              alt="Luxury Living Room Interior Design"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="inline-block px-2.5 py-1 rounded bg-white/20 backdrop-blur-xs text-[10px] uppercase tracking-wider font-semibold mb-2">
                Turnkey Villa Project · Bengaluru
              </span>
              <h4 className="text-lg sm:text-xl font-serif font-normal">
                &ldquo;They designed our entire 4-BHK duplex in teak and brass. Delivered on the exact promised date.&rdquo;
              </h4>
              <p className="text-xs text-gray-300 mt-1">
                — Aditya & Priyamvada Singhania, Sadashivanagar
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Lead Form */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-lg border border-[#E5E0D8] shadow-sm flex flex-col justify-center">
            <div className="mb-4">
              <h3 className="text-lg font-serif font-semibold text-gray-900">
                Book Your Complimentary Design Consultation
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Speak with our lead architect. Includes 3D spatial estimation and exact cost breakdown.
              </p>
            </div>

            <LeadForm defaultInterestType="INTERIOR_DESIGN" compact={true} />
          </div>
        </div>
      </div>
    </section>
  );
}
