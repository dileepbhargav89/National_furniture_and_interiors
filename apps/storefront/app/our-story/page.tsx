'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle2,
  MapPin,
  Layers,
  Award,
  MessageCircle,
} from 'lucide-react';

export default function OurStoryPage() {
  return (
    <div className="bg-[#FAF9F6] text-neutral-900 selection:bg-[#8C7355] selection:text-white min-h-screen">
      {/* ── 1. ARCHITECTURAL HERO SECTION ────────────────────────────── */}
      <section className="relative h-[85vh] min-h-[620px] w-full bg-[#171717] overflow-hidden flex items-center justify-center">
        <Image
          src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2000&auto=format&fit=crop"
          alt="National Furniture & Interiors Architectural Living Space"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-[#171717]/60 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 md:px-8 mt-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Bengaluru Woodcraft & Turnkey Interior Heritage</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl font-light text-white leading-tight md:leading-[1.1] mb-6">
            Where Craftsmanship Meets <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#FAF9F6]">Architectural Precision.</span>
          </h1>

          <p className="mt-4 text-neutral-300 text-sm sm:text-base md:text-xl font-light max-w-2xl mx-auto leading-relaxed mb-10">
            Founded in Bengaluru in 1998, National Furniture & Interiors brings together 28+ years of dedicated solid wood craftsmanship, bespoke upholstery, and holistic turnkey interior architecture.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/collections"
              className="px-7 py-3.5 bg-[#8C7355] hover:bg-[#a38765] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-lg"
            >
              Explore Curated Suites
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors"
            >
              Visit HSR Layout Studio
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. LIVE TRUST & HERITAGE STAT STRIP ──────────────────────── */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xl">
          <div className="p-3 border-r border-neutral-100 last:border-0">
            <div className="flex items-center gap-2 text-[#8C7355] mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900">Est. 1998</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">28+ Years In Bengaluru</p>
          </div>

          <div className="p-3 border-r border-neutral-100 last:border-0">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900">40,000 sq.ft</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">Manufacturing Atelier</p>
          </div>

          <div className="p-3 border-r border-neutral-100 last:border-0">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900">1,200+ Homes</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">Styled Across Bengaluru</p>
          </div>

          <div className="p-3">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900">10-Year</span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">BWP Marine Warranty</p>
          </div>
        </div>
      </section>

      {/* ── 3. THE BRAND NARRATIVE & BENGALURU ROOTS ─────────────────── */}
      <section className="py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 group">
            <Image
              src="https://images.unsplash.com/photo-1540932239986-30128078f3c5?q=80&w=1400&auto=format&fit=crop"
              alt="Artisan woodworking and hand joinery at National Furniture & Interiors"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37] block mb-1">
                Authentic Craftsmanship
              </span>
              <p className="text-sm font-light text-neutral-200">
                Master carpenters hand-shaping kiln-seasoned Burma teak at our Bengaluru facility.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-3">
              The National Furniture & Interiors Story
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-neutral-900 leading-tight mb-6">
              Built on woodcraft integrity, <br />
              refined for modern living.
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
              <p>
                In 1998, National Furniture & Interiors was established in Bengaluru with a clear conviction:
                homeowners deserved genuine solid wood craftsmanship without the inflated multi-tier retail markups of middleman showrooms.
              </p>
              <p>
                What began as a focused master woodworking workshop has grown into a 40,000 sq.ft state-of-the-art manufacturing atelier and comprehensive turnkey interior architecture practice.
                Yet our core principle has never wavered — we control every stage of production, from raw timber seasoning to final white-glove installation.
              </p>
              <p>
                Every piece that leaves our workshop is engineered to withstand Bengaluru’s seasonal climate shifts, using 12-stage moisture regulation, Century 710 Club Prime BWP Marine Plywood, and precision mortise-and-tenon joinery.
              </p>
            </div>

            <div className="pt-6 flex items-center gap-6">
              <div>
                <span className="font-serif text-2xl font-bold text-neutral-900 block">4.8 / 5</span>
                <span className="text-xs text-neutral-500">Google & Justdial Rating</span>
              </div>
              <div className="h-10 w-px bg-neutral-200" />
              <div>
                <span className="font-serif text-2xl font-bold text-neutral-900 block">Direct Value</span>
                <span className="text-xs text-neutral-500">Master Atelier Pricing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. VERIFIED HISTORICAL TIMELINE (1998 – 2026) ─────────────── */}
      <section className="py-20 md:py-28 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-2">
              Our Milestones
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-neutral-900">
              28 Years of Architectural Evolution
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-2">
              From our first bespoke solid teak tables in 1998 to furnishing 1,200+ luxury residences across Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-neutral-200 relative">
              <span className="font-serif text-3xl font-light text-[#8C7355] block mb-3">1998</span>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Founding Workshop</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Established with master carpenters specializing in custom teak dining, heirloom beds, and tailored solid-wood architectural joinery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-neutral-200 relative">
              <span className="font-serif text-3xl font-light text-[#8C7355] block mb-3">2008</span>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">HSR Layout Studio</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Opened our flagship showroom opposite Purva Fairmont Apartment, connecting discerning homeowners directly with master woodcrafters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-neutral-200 relative">
              <span className="font-serif text-3xl font-light text-[#8C7355] block mb-3">2016</span>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">40,000 sq.ft Atelier</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Commissioned our dedicated Bengaluru production facility with German panel machinery, automated wood kilns, and metal craft units.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-neutral-200 relative">
              <span className="font-serif text-3xl font-light text-[#8C7355] block mb-3">2026</span>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">Architectural Suites</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pioneering curated living suites blending PVD-coated brass, Century 710 marine ply, and Belgian bouclé with 45-day handover delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. CRAFTSMANSHIP IN ACTION (AUTHENTIC WOODWORK & NO LAPTOPS) ─ */}
      <section className="py-20 md:py-32 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-2">
            Inside Our Workshop
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-light text-neutral-900">
            Uncompromising Standards. <br />
            No Shortcuts.
          </h2>
          <p className="text-neutral-500 text-xs sm:text-sm mt-3">
            Every furniture piece undergoes 14 structural quality checks before being cleared for white-glove delivery in Bengaluru.
          </p>
        </div>

        {/* Pillar 1: Master Wood Joinery & Seasoning (REPLACED GENERIC LAPTOP IMAGE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 group">
            <Image
              src="https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?q=80&w=1400&auto=format&fit=crop"
              alt="Master wood joinery and timber craftsmanship at National Furniture & Interiors"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-2">
              Wood Foundation & Moisture Control
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 mb-4">
              Mortise-and-Tenon Joinery with Kiln-Drying
            </h3>
            <p className="text-neutral-600 text-sm font-light leading-relaxed mb-6">
              Unlike mass-manufactured flatpack furniture held together by fragile cam locks, our artisans employ traditional mortise-and-tenon and dowel joints reinforced with marine adhesive.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Burma & Malabar Teak dried to 8–10% moisture content</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero warping or joint loosening in Bengaluru’s monsoon seasons</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Hand-sanded across 5 progressive grit levels for silky surfaces</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pillar 2: Tailored Upholstery & Cushioning */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-2">
              Tailored Upholstery
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 mb-4">
              Belgian Bouclés & High-Resilience Layering
            </h3>
            <p className="text-neutral-600 text-sm font-light leading-relaxed mb-6">
              Comfort is engineered from the sub-frame up. We layer high-density 40D/32D foam with memory cushioning and feather-touch fiber wraps, wrapped in 40,000+ Martindale rub count fabrics.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stain-resistant bouclés, linens, and top-grain Italian leathers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sinuous steel spring suspension with nylon noise dampeners</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Custom fabric swatch kits delivered directly to your doorstep</span>
              </li>
            </ul>
          </div>
          <div className="lg:col-span-7 order-1 lg:order-2 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 group">
            <Image
              src="https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?q=80&w=1400&auto=format&fit=crop"
              alt="Artisan upholstery and fabric stitching detail at National Furniture & Interiors"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Pillar 3: PVD Architectural Metalcraft */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 group">
            <Image
              src="https://images.unsplash.com/photo-1552554701-447a1bc1b470?q=80&w=1400&auto=format&fit=crop"
              alt="PVD coated stainless steel and brass accent joinery"
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="lg:col-span-5">
            <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-2">
              Architectural Hardware
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 mb-4">
              PVD Gold & Blum Soft-Close Systems
            </h3>
            <p className="text-neutral-600 text-sm font-light leading-relaxed mb-6">
              Our dining table frames, console legs, and coffee table pedestals utilize high-grade 304 stainless steel coated via Physical Vapor Deposition (PVD) for lifetime corrosion resistance.
            </p>
            <ul className="space-y-3 text-xs sm:text-sm text-neutral-700">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Austrian Blum soft-close concealed hinges and drawer slides</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Brushed brass, rose gold, and matte charcoal titanium finishes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Heavy gauge tubular steel tested for 250+ kg load capacity</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 6. MATERIALS PALETTE ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest block mb-2">
                Curated Materiality
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-light text-white">
                Selected for Longevity.
              </h2>
            </div>
            <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
              We exclusively specify certified Century 710 marine plywood, kiln-seasoned hardwoods, and premium architectural surfaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-800/60 border border-neutral-700 rounded-2xl p-6 group hover:border-[#8C7355] transition-colors">
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-6">
                <Image
                  src="https://images.unsplash.com/photo-1582879579679-38e9fc7e3f28?q=80&w=800&auto=format&fit=crop"
                  alt="Century 710 Club Prime BWP Marine Plywood & Seasoned Teak"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-xl font-medium text-white mb-2">BWP Marine Ply & Teak</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Boiling Waterproof Century 710 Club Prime cores combined with kiln-seasoned Burma and Sheesham hardwoods for lifetime structural integrity.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 rounded-2xl p-6 group hover:border-[#8C7355] transition-colors">
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-6">
                <Image
                  src="https://images.unsplash.com/photo-1558239063-e5e347781b0a?q=80&w=800&auto=format&fit=crop"
                  alt="Belgian Bouclé & Italian Linen Weaves"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-xl font-medium text-white mb-2">European Bouclés & Linens</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                High Martindale rub count textiles resistant to stains, fading, and pet claws, tailored with precision French seams.
              </p>
            </div>

            <div className="bg-neutral-800/60 border border-neutral-700 rounded-2xl p-6 group hover:border-[#8C7355] transition-colors">
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative mb-6">
                <Image
                  src="https://images.unsplash.com/photo-1552554701-447a1bc1b470?q=80&w=800&auto=format&fit=crop"
                  alt="PVD Titanium & Brushed Brass Accents"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-serif text-xl font-medium text-white mb-2">PVD Metals & Italian Veneers</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Mirror and hairline satin vacuum-deposited gold accents paired with smoked oak, walnut, and eucalyptus natural veneers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. EXPERIENCE IN PERSON & ACTION CTA ──────────────────────── */}
      <section className="py-20 md:py-32 bg-white border-t border-neutral-200 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-semibold text-[#8C7355] uppercase tracking-widest block mb-3">
            Visit Us in HSR Layout
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-neutral-900 leading-tight mb-6">
            Experience Our Craft in Person.
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 font-light max-w-2xl mx-auto leading-relaxed mb-10">
            Touch our solid teak samples, test ergonomic sofa proportions, and speak directly with our senior interior architects at our flagship Bengaluru studio.
          </p>

          <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-neutral-200 max-w-xl mx-auto mb-10 text-left">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#8C7355]/10 text-[#8C7355] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  National Furniture & Interiors Showroom
                </h3>
                <p className="text-xs text-neutral-600 mt-1">
                  #1315, 24th Main Road, Opp. to Purva Fairmont Apartment, Sector 2, HSR Layout, Bengaluru 560102
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                  <span>● Open 7 Days: 10:00 AM – 9:30 PM</span>
                  <span>● Dedicated Parking Available</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-md"
            >
              Get Store Directions
            </Link>
            <a
              href="https://wa.me/919663628302?text=Hello%20National%20Furniture%20%26%20Interiors%20team%2C%20I%20would%20like%20to%20visit%20your%20HSR%20Layout%20showroom."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
            <Link
              href="/design-services#lead-form"
              className="w-full sm:w-auto px-8 py-3.5 bg-white border border-neutral-300 text-neutral-900 text-xs font-semibold uppercase tracking-wider rounded-xl hover:border-neutral-900 transition-colors"
            >
              Book Free Site Visit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
