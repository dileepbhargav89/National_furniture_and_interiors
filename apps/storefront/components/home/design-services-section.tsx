import React from 'react';
import Image from 'next/image';
import { LeadForm } from '../lead-form';
import { useScrollReveal } from '../../hooks/use-scroll-reveal';

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
  const { ref, isRevealed } = useScrollReveal<HTMLElement>({ threshold: 0.15 });

  return (
    <section
      id="design-consultation"
      ref={ref}
      className={`reveal-on-scroll border-t border-[#EBE8E3] bg-[#FAF9F6] py-16 sm:py-20 ${
        isRevealed ? 'is-revealed' : ''
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8C7355]">
            Turnkey Residential & Commercial
          </p>
          <h2 className="font-serif text-2xl font-normal tracking-tight text-[#171717] sm:text-3xl lg:text-4xl">
            Complete Interior Architecture
          </h2>
          <p className="mt-2.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
            From bare-shell villas to modern apartments, our design studio blends bespoke teak
            craftsmanship with smart spatial engineering.
          </p>
        </div>

        {/* 3-Step Process Bar */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {DESIGN_STEPS.map((item) => (
            <div
              key={item.step}
              className="luxury-card-hover relative rounded-lg border border-[#E5E0D8] bg-white p-5 sm:p-6"
            >
              <span className="mb-2 block font-serif text-2xl font-bold text-[#8C7355]/30 transition-colors duration-300 group-hover:text-[#E07020]">
                {item.step}
              </span>
              <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="text-xs leading-relaxed text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Split Grid: Interior Visual Showcase + Compact Lead Form */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Left Column: Architectural Photo Showcase */}
          <div className="luxury-card-hover group relative min-h-[380px] overflow-hidden rounded-lg border border-[#E5E0D8] lg:col-span-6 lg:min-h-[460px]">
            <Image
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200&auto=format&fit=crop"
              alt="Luxury Living Room Interior Design"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="luxury-img-zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="backdrop-blur-xs mb-2 inline-block rounded bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                Turnkey Villa Project · Bengaluru
              </span>
              <h4 className="font-serif text-lg font-normal sm:text-xl">
                &ldquo;They designed our entire 4-BHK duplex in teak and brass. Delivered on the
                exact promised date.&rdquo;
              </h4>
              <p className="mt-1 text-xs text-gray-300">
                — Aditya & Priyamvada Singhania, Sadashivanagar
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Consultation Lead Form */}
          <div className="flex flex-col justify-center rounded-lg border border-[#E5E0D8] bg-white p-6 shadow-sm sm:p-8 lg:col-span-6">
            <div className="mb-4">
              <h3 className="font-serif text-lg font-semibold text-gray-900">
                Book Your Complimentary Design Consultation
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Speak with our lead architect. Includes 3D spatial estimation and exact cost
                breakdown.
              </p>
            </div>

            <LeadForm defaultInterestType="INTERIOR_DESIGN" compact={true} />
          </div>
        </div>
      </div>
    </section>
  );
}
