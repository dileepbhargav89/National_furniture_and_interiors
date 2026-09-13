'use client';

import { useState, useId } from 'react';
import { Home, Building2, Utensils, Hotel, ShoppingBag, Layers, CheckCircle2, ArrowRight, MessageSquare, ShieldCheck, Sparkles, Briefcase } from 'lucide-react';

type EstimatorSector = 'residential' | 'commercial';
type BhkType = '1bhk' | '2bhk' | '3bhk' | '4bhk' | 'villa';
type CommercialType = 'office' | 'restaurant' | 'hotel' | 'retail';
type PackageTier = 'essential' | 'premium' | 'bespoke';

interface BhkOption {
  id: BhkType;
  label: string;
  sublabel: string;
  avgSqFt: number;
}

interface CommercialOption {
  id: CommercialType;
  label: string;
  sublabel: string;
  avgSqFt: number;
  icon: typeof Building2;
  rateStandard: number;
  ratePremium: number;
}

interface TierOption {
  id: PackageTier;
  title: string;
  tagline: string;
  badge?: string;
  ratePerSqFt: number;
  woodGrade: string;
  hardware: string;
  finishes: string;
}

const BHK_OPTIONS: BhkOption[] = [
  { id: '1bhk', label: '1 BHK', sublabel: '600 – 750 sq.ft', avgSqFt: 680 },
  { id: '2bhk', label: '2 BHK', sublabel: '1,000 – 1,350 sq.ft', avgSqFt: 1180 },
  { id: '3bhk', label: '3 BHK', sublabel: '1,500 – 2,100 sq.ft', avgSqFt: 1800 },
  { id: '4bhk', label: '4 BHK / Duplex', sublabel: '2,400 – 3,200 sq.ft', avgSqFt: 2800 },
  { id: 'villa', label: 'Luxury Villa', sublabel: '3,500 – 5,000+ sq.ft', avgSqFt: 4000 },
];

const COMMERCIAL_OPTIONS: CommercialOption[] = [
  {
    id: 'office',
    label: 'Corporate Office',
    sublabel: 'Workstations, Boardrooms, Pods',
    avgSqFt: 3200,
    icon: Briefcase,
    rateStandard: 1350,
    ratePremium: 2100,
  },
  {
    id: 'restaurant',
    label: 'Restaurant & Café',
    sublabel: 'Bars, Booths, Commercial Kitchen',
    avgSqFt: 2800,
    icon: Utensils,
    rateStandard: 1850,
    ratePremium: 2800,
  },
  {
    id: 'hotel',
    label: 'Boutique Hotel',
    sublabel: 'Guest Suites, Lobby, Lounge',
    avgSqFt: 4500,
    icon: Hotel,
    rateStandard: 2200,
    ratePremium: 3400,
  },
  {
    id: 'retail',
    label: 'Retail Shop / Showroom',
    sublabel: 'Casework, Display, VIP Trial',
    avgSqFt: 1800,
    icon: ShoppingBag,
    rateStandard: 1650,
    ratePremium: 2600,
  },
];

const RESIDENTIAL_TIERS: TierOption[] = [
  {
    id: 'essential',
    title: 'Essential Living',
    tagline: 'Durable, sleek, and budget-optimized modular interiors',
    ratePerSqFt: 480,
    woodGrade: 'Century/Greenpanel MR Commercial Grade Plywood',
    hardware: 'Hettich / Ebco Soft-Close Hinges & Runners',
    finishes: 'Merino 1.0mm Anti-Scratch High-Pressure Laminates',
  },
  {
    id: 'premium',
    title: 'Premium Signature',
    tagline: 'Our most popular tier: Seamless luxury and German hardware',
    badge: 'Most Popular in Bangalore',
    ratePerSqFt: 780,
    woodGrade: 'Century Club Prime BWP 710 Marine Waterproof Plywood',
    hardware: 'German Blum Tandembox & Servo-Drive Lift Systems',
    finishes: 'Anti-Fingerprint High-Gloss Acrylic & Natural Oak Veneers',
  },
  {
    id: 'bespoke',
    title: 'Royal Bespoke',
    tagline: 'Artisanal hardwood, Italian marble, and motorized architecture',
    badge: 'Luxury Handcrafted',
    ratePerSqFt: 1250,
    woodGrade: 'Seasoned CP Teakwood & 100% Calibrated Marine Ply',
    hardware: 'Häfele Motorized Matrix Box & Integrated Profiling',
    finishes: 'Italian High-Gloss PU Lacquer, Brass Inlays & Statuario Marble',
  },
];

export function BangaloreCostEstimator() {
  const [sector, setSector] = useState<EstimatorSector>('residential');
  const [selectedBhk, setSelectedBhk] = useState<BhkType>('3bhk');
  const [selectedCommercial, setSelectedCommercial] = useState<CommercialType>('office');
  const [selectedTier, setSelectedTier] = useState<PackageTier>('premium');
  const [isCommercialLuxury, setIsCommercialLuxury] = useState<boolean>(true);
  const [includeCivilWork, setIncludeCivilWork] = useState<boolean>(true);
  const civilCheckboxId = useId();

  // Formatting helpers
  const formatLakhs = (amount: number) => {
    const inLakhs = amount / 100000;
    return `₹${inLakhs.toFixed(2)} Lakhs`;
  };

  // Default fallbacks with guaranteed types
  const DEFAULT_BHK: BhkOption = BHK_OPTIONS[2] as BhkOption;
  const DEFAULT_RES_TIER: TierOption = RESIDENTIAL_TIERS[1] as TierOption;
  const DEFAULT_COMMERCIAL: CommercialOption = COMMERCIAL_OPTIONS[0] as CommercialOption;

  // Residential Calculations
  const bhk: BhkOption = BHK_OPTIONS.find((b) => b.id === selectedBhk) ?? DEFAULT_BHK;
  const resTier: TierOption = RESIDENTIAL_TIERS.find((t) => t.id === selectedTier) ?? DEFAULT_RES_TIER;
  const resBaseCost = bhk.avgSqFt * resTier.ratePerSqFt;
  const resCivilCost = includeCivilWork ? Math.round(resBaseCost * 0.15) : 0;
  const resTotalCost = resBaseCost + resCivilCost;

  // Commercial Calculations
  const comm: CommercialOption = COMMERCIAL_OPTIONS.find((c) => c.id === selectedCommercial) ?? DEFAULT_COMMERCIAL;
  const commRate = isCommercialLuxury ? comm.ratePremium : comm.rateStandard;
  const commTotalCost = comm.avgSqFt * commRate;

  // Current active cost
  const activeTotalCost = sector === 'residential' ? resTotalCost : commTotalCost;
  const minRange = Math.round((activeTotalCost * 0.92) / 10000) * 10000;
  const maxRange = Math.round((activeTotalCost * 1.08) / 10000) * 10000;

  // Breakdown segments
  const residentialBreakdown = [
    { label: 'Modular Kitchen & Pantry', pct: 32, amount: Math.round(activeTotalCost * 0.32) },
    { label: 'Master Suite & Wardrobes', pct: 28, amount: Math.round(activeTotalCost * 0.28) },
    { label: 'Living, Dining & Foyer', pct: 24, amount: Math.round(activeTotalCost * 0.24) },
    { label: 'False Ceiling & Architectural Lighting', pct: 16, amount: Math.round(activeTotalCost * 0.16) },
  ];

  const commercialBreakdown = [
    { label: 'Custom Joinery, Desking & Casework', pct: 35, amount: Math.round(activeTotalCost * 0.35) },
    { label: 'Commercial HVAC, Fire Safety & MEP', pct: 25, amount: Math.round(activeTotalCost * 0.25) },
    { label: 'Acoustic Partitions & Commercial Flooring', pct: 22, amount: Math.round(activeTotalCost * 0.22) },
    { label: 'Architectural Lighting & Smart Controls', pct: 18, amount: Math.round(activeTotalCost * 0.18) },
  ];

  const currentBreakdown = sector === 'residential' ? residentialBreakdown : commercialBreakdown;
  const estimatedDays = sector === 'residential'
    ? selectedBhk === '1bhk' ? 30 : selectedBhk === '2bhk' ? 38 : selectedBhk === '3bhk' ? 42 : selectedBhk === '4bhk' ? 48 : 55
    : selectedCommercial === 'retail' ? 30 : selectedCommercial === 'office' ? 35 : selectedCommercial === 'restaurant' ? 45 : 55;

  const currentTitle = sector === 'residential' ? `${bhk.label} · ${resTier.title}` : `${comm.label} · ${isCommercialLuxury ? 'Luxury Architecture' : 'Turnkey Fit-Out'}`;

  const whatsappMessage = encodeURIComponent(
    `Hi National Furniture & Interiors team, I used your Bangalore ${sector === 'residential' ? 'Residential' : 'Commercial'} Interior Cost Estimator for my ${currentTitle} (~${formatLakhs(activeTotalCost)}). Could I schedule a site survey & consultation?`
  );

  return (
    <section id="cost-estimator" className="py-20 md:py-28 bg-[#FAF9F6] border-y border-stone-200 scroll-mt-24">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-900 text-[12px] font-medium tracking-wide uppercase mb-4">
            <Sparkles size={13} className="text-amber-600" />
            <span>Bengaluru Turnkey Cost Estimator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-light text-[#171717] tracking-tight mb-4">
            Calculate Residential &amp; Commercial Project Costs
          </h2>
          <p className="text-stone-600 text-base md:text-lg leading-relaxed font-light">
            Transparent Bengaluru pricing for luxury homes, restaurants, boutique hotels, corporate workspaces, and retail showrooms.
          </p>

          {/* Sector Mode Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/80 mt-8 border border-stone-300 shadow-inner">
            <button
              type="button"
              onClick={() => setSector('residential')}
              className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all ${
                sector === 'residential'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Residential Interiors (BHK &amp; Villas)
            </button>
            <button
              type="button"
              onClick={() => setSector('commercial')}
              className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all ${
                sector === 'commercial'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Commercial &amp; Hospitality (Offices, F&amp;B, Hotels)
            </button>
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Controls (7 cols) */}
          <div className="p-6 md:p-10 lg:col-span-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-stone-100">
            <div>
              {/* Sector-Specific Step 1 */}
              {sector === 'residential' ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3.5">
                    <label className="text-[13px] font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                      <Home size={16} className="text-[#8C7355]" />
                      <span>Step 1: Select Home Layout</span>
                    </label>
                    <span className="text-xs text-stone-500 font-medium">Approx. {bhk.avgSqFt} sq.ft carpet</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {BHK_OPTIONS.map((opt) => {
                      const isSelected = selectedBhk === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedBhk(opt.id)}
                          className={`p-3 text-center rounded-xl transition-all border text-left flex flex-col justify-center items-center ${
                            isSelected
                              ? 'bg-[#171717] text-white border-[#171717] shadow-sm ring-2 ring-[#8C7355]/50'
                              : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-stone-100/60'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <span className="text-sm font-semibold block">{opt.label}</span>
                          <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {opt.sublabel.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3.5">
                    <label className="text-[13px] font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                      <Building2 size={16} className="text-[#8C7355]" />
                      <span>Step 1: Select Commercial Space Type</span>
                    </label>
                    <span className="text-xs text-stone-500 font-medium">Approx. {comm.avgSqFt} sq.ft</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COMMERCIAL_OPTIONS.map((opt) => {
                      const isSelected = selectedCommercial === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedCommercial(opt.id)}
                          className={`p-4 rounded-xl transition-all border text-left flex items-start gap-3.5 ${
                            isSelected
                              ? 'bg-[#171717] text-white border-[#171717] shadow-sm ring-2 ring-[#8C7355]/50'
                              : 'bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-400 hover:bg-stone-100/60'
                          }`}
                          aria-pressed={isSelected}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-stone-700'}`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <span className="text-sm font-semibold block">{opt.label}</span>
                            <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                              {opt.sublabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sector-Specific Step 2 */}
              {sector === 'residential' ? (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3.5">
                    <label className="text-[13px] font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                      <Layers size={16} className="text-[#8C7355]" />
                      <span>Step 2: Choose Quality Specification</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    {RESIDENTIAL_TIERS.map((t) => {
                      const isSelected = selectedTier === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTier(t.id)}
                          className={`p-4 rounded-xl cursor-pointer border transition-all relative ${
                            isSelected
                              ? 'bg-amber-50/40 border-[#8C7355] shadow-xs'
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {t.badge && (
                            <span className="absolute -top-2.5 right-4 bg-[#8C7355] text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                              {t.badge}
                            </span>
                          )}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#8C7355] bg-[#8C7355]' : 'border-stone-300'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-stone-900">{t.title}</h4>
                                <p className="text-xs text-stone-500 mt-0.5">{t.tagline}</p>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1 rounded">
                              ₹{t.ratePerSqFt}/sq.ft
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3.5">
                    <label className="text-[13px] font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
                      <Layers size={16} className="text-[#8C7355]" />
                      <span>Step 2: Commercial Fit-Out Grade</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setIsCommercialLuxury(false)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        !isCommercialLuxury
                          ? 'bg-amber-50/50 border-[#8C7355] shadow-xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-semibold text-stone-900 block">Standard Commercial Turnkey</span>
                      <p className="text-[11.5px] text-stone-500 mt-1">Modular workstations, standard commercial flooring, LED lighting, basic acoustic wall panels.</p>
                      <span className="inline-block mt-3 text-xs font-semibold text-[#8C7355]">₹{comm.rateStandard}/sq.ft</span>
                    </div>

                    <div
                      onClick={() => setIsCommercialLuxury(true)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        isCommercialLuxury
                          ? 'bg-amber-50/50 border-[#8C7355] shadow-xs'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-semibold text-stone-900 block">Flagship Luxury Architecture</span>
                      <p className="text-[11.5px] text-stone-500 mt-1">Italian marble, acoustic double glazing, custom solid teak bar/reception, IoT scene lighting.</p>
                      <span className="inline-block mt-3 text-xs font-semibold text-[#8C7355]">₹{comm.ratePremium}/sq.ft</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Add-on: Electrical & Civil Checkbox (only shown for residential) */}
              {sector === 'residential' && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <label htmlFor={civilCheckboxId} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      id={civilCheckboxId}
                      type="checkbox"
                      checked={includeCivilWork}
                      onChange={(e) => setIncludeCivilWork(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-[#8C7355] focus:ring-[#8C7355]"
                    />
                    <div>
                      <span className="text-xs font-semibold text-stone-800 block">Include False Ceiling, Electricals &amp; Paint</span>
                      <span className="text-[11px] text-stone-500 block">Complete ready-to-move turnkey package</span>
                    </div>
                  </label>
                  <span className="text-xs text-stone-600 font-medium">+15% Turnkey Scope</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Summary Panel (5 cols) */}
          <div className="bg-[#171717] text-white p-6 md:p-10 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-6">
                <div>
                  <p className="text-[11px] font-medium tracking-widest text-amber-400 uppercase">Estimated Budget Ballpark</p>
                  <h3 className="text-xl md:text-2xl font-serif font-light text-white mt-1">{currentTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-stone-800 text-[11px] text-stone-300 border border-stone-700">
                    {estimatedDays}-Day Delivery
                  </span>
                </div>
              </div>

              {/* Price Big Display */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-serif font-semibold text-white">
                    {formatLakhs(minRange)} – {formatLakhs(maxRange)}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  *All-inclusive commercial estimate including GST, architectural drawings, project management, and site handover.
                </p>
              </div>

              {/* Itemized Room/Commercial Breakdown */}
              <div className="space-y-3 mb-8">
                <p className="text-[11px] uppercase tracking-wider text-stone-400 font-medium">Approx. Scope Allocation</p>
                {currentBreakdown.map((item) => (
                  <div key={item.label} className="text-xs">
                    <div className="flex justify-between text-stone-300 mb-1">
                      <span>{item.label}</span>
                      <span className="font-medium text-white">{formatLakhs(item.amount)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Assurance Trust Badges */}
              <div className="pt-4 border-t border-stone-800 grid grid-cols-2 gap-3 text-[11.5px] text-stone-300 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
                  <span>10-Yr BWP Warranty</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-amber-400 shrink-0" />
                  <span>On-Time Handover Guarantee</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-4">
              <a
                href="#book-consultation"
                className="w-full bg-[#8C7355] text-white hover:bg-[#7a6448] py-3.5 px-5 rounded-xl text-center text-sm font-medium tracking-wide transition-all shadow-md flex items-center justify-center gap-2 group"
              >
                <span>Book Free Site Survey With This Quote</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-stone-800 text-stone-200 hover:bg-stone-700 hover:text-white py-3 px-5 rounded-xl text-center text-xs font-medium tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare size={14} className="text-emerald-400" />
                <span>WhatsApp Quote to Principal Architect</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
