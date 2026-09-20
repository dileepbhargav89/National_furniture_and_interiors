import Image from 'next/image';
import { Sparkles, CheckCircle2, ShieldCheck, MapPin, MessageSquare, Star } from 'lucide-react';
import { LeadForm } from '../../components/lead-form';
import { ConsultationTriggerButton } from '../../components/consultation/consultation-trigger-button';
import { BangaloreCostEstimator } from '../../components/design-services/bangalore-cost-estimator';
import { PortfolioFilterGrid } from '../../components/design-services/portfolio-filter-grid';
import { ExperienceStudiosStrip } from '../../components/design-services/experience-studios-strip';
import { GuaranteeAndProcess } from '../../components/design-services/guarantee-and-process';
import { CapabilitiesSection } from '../../components/design-services/capabilities-section';

import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../../data/portfolio-projects';

export const metadata = {
  title:
    'Luxury Residential & Commercial Interior Design in Bengaluru | National Furniture & Interiors',
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
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-stone-950 pb-16 pt-20 text-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Residential and Commercial Interior Design in Bengaluru"
            fill
            sizes="100vw"
            className="scale-105 object-cover opacity-45"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
        </div>

        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center md:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-900/80 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-stone-300 backdrop-blur-md">
            <Sparkles size={13} className="text-amber-400" />
            <span>Bengaluru&apos;s Premier Turnkey Architecture &amp; Interiors · Est. 1998</span>
          </div>

          <h1 className="mb-6 font-serif text-4xl font-light leading-[1.12] tracking-tight text-white sm:text-5xl md:text-7xl">
            Turnkey Interiors for <br className="hidden sm:inline" />
            <span className="font-normal italic text-amber-200/95">
              Bengaluru&apos;s Finest
            </span>{' '}
            Spaces.
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-base font-light leading-relaxed text-stone-200 sm:text-lg md:text-xl">
            Bespoke residential interiors, fine dining restaurants, boutique hotels, high-tech
            corporate offices, and luxury retail showrooms. Designed at our Indiranagar studio,
            manufactured in our 40,000 sq.ft Bengaluru factory with guaranteed on-time delivery.
          </p>

          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ConsultationTriggerButton
              label="Book Free 3D Consultation"
              variant="primary"
              className="w-full sm:w-auto"
            />

            <a
              href="#cost-estimator"
              className="w-full rounded-xl border border-white/30 bg-white/10 px-8 py-4 text-center text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:w-auto"
            >
              Calculate Bangalore Interior Cost
            </a>
          </div>

          {/* Proof Badges Strip */}
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 border-t border-white/15 pt-8 md:grid-cols-4">
            {BENGALURU_PROOF_PILLARS.map((p) => (
              <div key={p.label} className="p-3 text-center">
                <span className="block font-serif text-2xl font-semibold text-white md:text-3xl">
                  {p.value}
                </span>
                <span className="mt-0.5 block text-xs font-medium text-amber-300/90">
                  {p.label}
                </span>
                <span className="block text-[11px] text-stone-400">{p.sub}</span>
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
      <section className="border-b border-stone-200 bg-stone-50 py-24">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#8C7355]">
              Homeowner Voices
            </p>
            <h2 className="mb-4 font-serif text-3xl font-light tracking-tight text-[#171717] md:text-5xl">
              Trusted by 380+ Bengaluru Families
            </h2>
            <p className="text-sm font-light leading-relaxed text-stone-600 md:text-base">
              Read how homeowners across Whitefield, Lavelle Road, Bellandur, and Indiranagar
              experienced our precision carpentry and timely 45-day delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <div>
                <div className="mb-3 flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mb-6 text-xs italic leading-relaxed text-stone-700 md:text-sm">
                  &ldquo;The difference between modular aggregators and NFI is their 40,000 sq.ft
                  factory in Peenya. Everything arrived pre-drilled with zero sawdust in our new
                  apartment. Finished right on day 42.&rdquo;
                </p>
              </div>
              <div className="border-t border-stone-100 pt-4">
                <span className="block text-xs font-semibold text-stone-900">
                  Rahul &amp; Sneha Nair
                </span>
                <span className="block text-[11px] text-[#8C7355]">
                  Prestige Lakeside Habitat, Whitefield
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <div>
                <div className="mb-3 flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mb-6 text-xs italic leading-relaxed text-stone-700 md:text-sm">
                  &ldquo;We wanted solid CP teakwood joinery and brass inlays for our penthouse.
                  Most interior companies only do particle board. NFI handcrafted authentic
                  heirloom-grade woodwork that took our breath away.&rdquo;
                </p>
              </div>
              <div className="border-t border-stone-100 pt-4">
                <span className="block text-xs font-semibold text-stone-900">Vikramaditya Rao</span>
                <span className="block text-[11px] text-[#8C7355]">
                  Kingfisher Towers, Lavelle Road
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <div>
                <div className="mb-3 flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="mb-6 text-xs italic leading-relaxed text-stone-700 md:text-sm">
                  &ldquo;Living in the US while our Bellandur villa was being completed was totally
                  stress-free thanks to their weekly 3D walkthrough updates. Their itemized BOQ had
                  zero hidden surprises.&rdquo;
                </p>
              </div>
              <div className="border-t border-stone-100 pt-4">
                <span className="block text-xs font-semibold text-stone-900">
                  Pradeep &amp; Shalini Reddy
                </span>
                <span className="block text-[11px] text-[#8C7355]">
                  Adarsh Palm Retreat, Bellandur
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Priority Consultation Booking & Lead Generation Section ── */}
      <section className="scroll-mt-24 bg-white py-24" id="book-consultation">
        <div className="container mx-auto max-w-6xl px-4 md:px-8">
          <div
            id="consultation"
            className="flex scroll-mt-28 flex-col items-center gap-12 lg:flex-row lg:gap-16"
          >
            {/* Left Copy & Trust Highlights */}
            <div className="flex-1">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-900">
                <MapPin size={12} className="text-amber-700" />
                <span>Complimentary In-Studio or In-Home Visit</span>
              </div>

              <h2 className="mb-6 font-serif text-3xl font-light leading-tight tracking-tight text-[#171717] sm:text-4xl md:text-5xl">
                Ready to Design Your <br />
                <span className="font-normal italic text-[#8C7355]">Dream Home?</span>
              </h2>

              <p className="mb-8 text-sm font-light leading-relaxed text-stone-600 md:text-base">
                Schedule a complimentary 1-on-1 session with our senior architects at our
                Indiranagar Flagship Studio or at your apartment anywhere in Bengaluru. We will
                review your floorplan, understand your lifestyle requirements, and prepare a 3D
                design concept and itemized BOQ estimate.
              </p>

              <div className="mb-8 space-y-4">
                <div className="flex items-start gap-3 text-xs text-stone-800 md:text-sm">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="block text-stone-900">
                      Complimentary 3D Space Planning Concept
                    </strong>
                    <span className="text-xs text-stone-500">
                      Visualize layout flow, storage zones, and furniture placement
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-stone-800 md:text-sm">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="block text-stone-900">
                      Direct Factory Itemized BOQ Quote
                    </strong>
                    <span className="text-xs text-stone-500">
                      Transparent line-by-line pricing with 100% rate lock
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-stone-800 md:text-sm">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <strong className="block text-stone-900">
                      Tactile Material &amp; Fitting Walkthrough
                    </strong>
                    <span className="text-xs text-stone-500">
                      Experience genuine Century BWP ply, Blum hardware, and Italian finishes
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#FAF9F6] p-4">
                <div>
                  <span className="block text-xs font-semibold text-stone-900">
                    Need Instant Assistance?
                  </span>
                  <span className="block text-[11px] text-stone-500">
                    Speak directly with our senior Bangalore design team
                  </span>
                </div>
                <a
                  href="https://wa.me/919876543210?text=Hi%20NFI%20team%2C%20I%20would%20like%20to%20consult%20an%20architect%20for%20my%20Bangalore%20home%20interiors."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shadow-2xs flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp Architect</span>
                </a>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="w-full shrink-0 rounded-2xl border border-stone-200 bg-[#FAF9F6] p-6 shadow-2xl sm:p-8 md:p-10 lg:w-[500px]">
              <div className="mb-6">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-[#8C7355]">
                  Bengaluru Design Consultation
                </span>
                <h3 className="font-serif text-xl font-medium text-stone-900">
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
