import Image from 'next/image';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, MapPin, MessageSquare, Star } from 'lucide-react';
import { LeadForm } from '../../components/lead-form';
import { BangaloreCostEstimator } from '../../components/design-services/bangalore-cost-estimator';
import { PortfolioFilterGrid } from '../../components/design-services/portfolio-filter-grid';
import { ExperienceStudiosStrip } from '../../components/design-services/experience-studios-strip';
import { GuaranteeAndProcess } from '../../components/design-services/guarantee-and-process';
import { CapabilitiesSection } from '../../components/design-services/capabilities-section';

import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../../data/portfolio-projects';

export const metadata = {
  title: 'Luxury Residential & Commercial Interior Design in Bengaluru | National Furniture & Interiors',
  description:
    'Turnkey residential interiors, fine dining restaurants, boutique hotels, corporate workspaces, and luxury retail shops in Bengaluru. 45-day handover guarantee, 10-year warranty, 40,000 sq.ft factory, and studios in Indiranagar, Whitefield & HSR Layout.',
};

async function getPortfolioProjects(): Promise<PortfolioProject[]> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'http://localhost:4000';
    const res = await fetch(`${apiUrl}/api/v1/design-projects/portfolio`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const items = json.data?.items || json.items;
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch {
    // Gracefully fall back to rich curated Bangalore dataset
  }
  return PORTFOLIO_PROJECTS;
}

const BENGALURU_PROOF_PILLARS = [
  { label: 'Spaces Delivered', value: '420+', sub: 'Homes & Commercial' },
  { label: 'Client Rating', value: '4.8 / 5', sub: 'Verified Patrons' },
  { label: 'Handover Guarantee', value: '45 Days', sub: 'Or We Pay Penalty' },
  { label: 'BWP Warranty', value: '10 Years', sub: 'Century 710 Marine' },
];

export default async function DesignServicesPage() {
  const projects = await getPortfolioProjects();
  return (
    <div className="min-h-screen bg-white">
      {/* ── 1. Hero Showcase ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-stone-950 text-white pt-20 pb-16">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Residential and Commercial Interior Design in Bengaluru"
            fill
            sizes="100vw"
            className="object-cover opacity-45 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/80 border border-stone-700/80 text-stone-300 text-xs font-medium tracking-wider uppercase mb-6 backdrop-blur-md">
            <Sparkles size={13} className="text-amber-400" />
            <span>Bengaluru&apos;s Premier Turnkey Architecture &amp; Interiors · Est. 1998</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-light tracking-tight text-white mb-6 leading-[1.12]">
            Turnkey Interiors for <br className="hidden sm:inline" />
            <span className="italic font-normal text-amber-200/95">Bengaluru&apos;s Finest</span> Spaces.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-stone-200 max-w-3xl mx-auto font-light leading-relaxed mb-10">
            Bespoke residential interiors, fine dining restaurants, boutique hotels, high-tech corporate offices, and luxury retail showrooms. Designed at our Indiranagar studio, manufactured in our 40,000 sq.ft Bengaluru factory with guaranteed on-time delivery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#book-consultation"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#8C7355] text-white hover:bg-[#786144] text-xs font-semibold tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 group"
            >
              <span>Book Free 3D Consultation</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="#cost-estimator"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md text-xs font-semibold tracking-wider uppercase transition-colors text-center"
            >
              Calculate Bangalore Interior Cost
            </a>
          </div>

          {/* Proof Badges Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-white/15">
            {BENGALURU_PROOF_PILLARS.map((p) => (
              <div key={p.label} className="p-3 text-center">
                <span className="text-2xl md:text-3xl font-serif font-semibold text-white block">
                  {p.value}
                </span>
                <span className="text-xs font-medium text-amber-300/90 block mt-0.5">
                  {p.label}
                </span>
                <span className="text-[11px] text-stone-400 block">
                  {p.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Bengaluru Experience Studios Strip ── */}
      <ExperienceStudiosStrip />

      {/* ── 3. Interactive Bangalore Cost Estimator ── */}
      <BangaloreCostEstimator />

      {/* ── 4. Curated Portfolio Showcase ── */}
      <PortfolioFilterGrid initialProjects={projects} />

      {/* ── 5. Specialized Capabilities (Anchors for Menu) ── */}
      <CapabilitiesSection />

      {/* ── 6. Guarantees & 4-Step Transparent Journey ── */}
      <GuaranteeAndProcess />

      {/* ── 7. Verified Client Reviews & Bangalore Social Proof ── */}
      <section className="py-24 bg-stone-50 border-b border-stone-200">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-[0.25em] text-[#8C7355] font-semibold mb-3">
              Homeowner Voices
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-4">
              Trusted by 380+ Bengaluru Families
            </h2>
            <p className="text-stone-600 text-sm md:text-base font-light leading-relaxed">
              Read how homeowners across Whitefield, Lavelle Road, Bellandur, and Indiranagar experienced our precision carpentry and timely 45-day delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-stone-700 italic leading-relaxed mb-6">
                  &ldquo;The difference between modular aggregators and NFI is their 40,000 sq.ft factory in Peenya. Everything arrived pre-drilled with zero sawdust in our new apartment. Finished right on day 42.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-900 block">Rahul &amp; Sneha Nair</span>
                <span className="text-[11px] text-[#8C7355] block">Prestige Lakeside Habitat, Whitefield</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-stone-700 italic leading-relaxed mb-6">
                  &ldquo;We wanted solid CP teakwood joinery and brass inlays for our penthouse. Most interior companies only do particle board. NFI handcrafted authentic heirloom-grade woodwork that took our breath away.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-900 block">Vikramaditya Rao</span>
                <span className="text-[11px] text-[#8C7355] block">Kingfisher Towers, Lavelle Road</span>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-stone-700 italic leading-relaxed mb-6">
                  &ldquo;Living in the US while our Bellandur villa was being completed was totally stress-free thanks to their weekly 3D walkthrough updates. Their itemized BOQ had zero hidden surprises.&rdquo;
                </p>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <span className="text-xs font-semibold text-stone-900 block">Pradeep &amp; Shalini Reddy</span>
                <span className="text-[11px] text-[#8C7355] block">Adarsh Palm Retreat, Bellandur</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Priority Consultation Booking & Lead Generation Section ── */}
      <section className="py-24 bg-white scroll-mt-24" id="book-consultation">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div id="consultation" className="scroll-mt-28 flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            
            {/* Left Copy & Trust Highlights */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-semibold tracking-wider uppercase mb-4">
                <MapPin size={12} className="text-amber-700" />
                <span>Complimentary In-Studio or In-Home Visit</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-6 leading-tight">
                Ready to Design Your <br />
                <span className="italic font-normal text-[#8C7355]">Dream Home?</span>
              </h2>

              <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-8 font-light">
                Schedule a complimentary 1-on-1 session with our senior architects at our Indiranagar Flagship Studio or at your apartment anywhere in Bengaluru. We will review your floorplan, understand your lifestyle requirements, and prepare a 3D design concept and itemized BOQ estimate.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 text-xs md:text-sm text-stone-800">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">Complimentary 3D Space Planning Concept</strong>
                    <span className="text-stone-500 text-xs">Visualize layout flow, storage zones, and furniture placement</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs md:text-sm text-stone-800">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">Direct Factory Itemized BOQ Quote</strong>
                    <span className="text-stone-500 text-xs">Transparent line-by-line pricing with 100% rate lock</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs md:text-sm text-stone-800">
                  <MapPin size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-900">Tactile Material &amp; Fitting Walkthrough</strong>
                    <span className="text-stone-500 text-xs">Experience genuine Century BWP ply, Blum hardware, and Italian finishes</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-stone-900 block">Need Instant Assistance?</span>
                  <span className="text-[11px] text-stone-500 block">Speak directly with our senior Bangalore design team</span>
                </div>
                <a
                  href="https://wa.me/919876543210?text=Hi%20NFI%20team%2C%20I%20would%20like%20to%20consult%20an%20architect%20for%20my%20Bangalore%20home%20interiors."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp Architect</span>
                </a>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="w-full lg:w-[500px] shrink-0 bg-[#FAF9F6] p-6 sm:p-8 md:p-10 shadow-2xl border border-stone-200 rounded-2xl">
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-wider text-[#8C7355] font-semibold block mb-1">
                  Bengaluru Design Consultation
                </span>
                <h3 className="text-xl font-serif font-medium text-stone-900">
                  Request Free 3D Design Session
                </h3>
              </div>
              <LeadForm defaultInterestType="INTERIOR_DESIGN" showBangaloreFields={true} compact />
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
