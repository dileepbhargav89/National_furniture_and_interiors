'use client';

import { useState } from 'react';
import { LeadService, LeadInterestType, LeadProjectType, LeadTimeline, MarketingChannel } from '@nfi/api-client';
import { CheckCircle2, MessageCircle, Phone, ShieldCheck } from 'lucide-react';

// ── Label maps ────────────────────────────────────────────────────────────────
const INTEREST_LABELS: Record<LeadInterestType, string> = {
  INTERIOR_DESIGN: 'Interior Design Services',
  FURNITURE_PURCHASE: 'Furniture Purchase',
  BOTH: 'Both',
};

const PROJECT_TYPE_LABELS: Record<LeadProjectType, string> = {
  RESIDENTIAL: 'Residential Home',
  MODULAR_KITCHEN: 'Modular Kitchen',
  BEDROOM: 'Bedroom',
  LIVING_ROOM: 'Living Room',
  COMMERCIAL: 'Commercial Office',
  HOTEL: 'Hotel / Hospitality',
  RESTAURANT: 'Restaurant / Café',
  INSTITUTION: 'Institution / School',
};

const TIMELINE_LABELS: Record<LeadTimeline, string> = {
  IMMEDIATE: 'Immediately (within 1 month)',
  '1_3_MONTHS': '1 – 3 Months',
  '3_6_MONTHS': '3 – 6 Months',
  EXPLORING: 'Just Exploring',
};

const BUDGET_RANGES = [
  { label: 'Under ₹3 Lakhs', min: 0, max: 300000 },
  { label: '₹3 – 7 Lakhs', min: 300000, max: 700000 },
  { label: '₹7 – 15 Lakhs', min: 700000, max: 1500000 },
  { label: '₹15 – 30 Lakhs', min: 1500000, max: 3000000 },
  { label: 'Above ₹30 Lakhs', min: 3000000, max: 99999999 },
];

export const BENGALURU_LOCALITIES = [
  'Whitefield / ITPL',
  'Indiranagar / Old Airport Rd',
  'HSR Layout / Koramangala',
  'Sarjapur Road / Bellandur',
  'Hebbal / North Bengaluru',
  'Rajajinagar / Malleshwaram',
  'Electronic City / Bannerghatta',
  'JP Nagar / Jayanagar',
  'Other Bengaluru Locality',
];

export const CONSULTATION_MODES = [
  'In-Person at Indiranagar Flagship Studio',
  'In-Person at Whitefield Experience Center',
  'In-Person at HSR Layout Studio',
  'On-Site at My Bengaluru Apartment',
  'Virtual 3D Video Call (Zoom)',
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface LeadFormProps {
  defaultInterestType?: LeadInterestType;
  compact?: boolean; // Inline/compact layout (used on design-services page)
  showBangaloreFields?: boolean; // Show Bengaluru locality & consultation mode
  initialProjectType?: LeadProjectType;
  initialBudgetIndex?: string;
}

// ── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  name: string;
  phone: string;
  email: string;
  interestType: LeadInterestType | '';
  projectType: LeadProjectType | '';
  budgetIndex: string; // index into BUDGET_RANGES
  timeline: LeadTimeline | '';
  propertyLocation: string;
  consultationMode: string;
  consentGranted: boolean;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

// ── Component ─────────────────────────────────────────────────────────────────
export function LeadForm({
  defaultInterestType,
  compact = false,
  showBangaloreFields = false,
  initialProjectType,
  initialBudgetIndex,
}: LeadFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    email: '',
    interestType: defaultInterestType ?? '',
    projectType: initialProjectType ?? '',
    budgetIndex: initialBudgetIndex ?? '',
    timeline: '',
    propertyLocation: '',
    consultationMode: '',
    consentGranted: false,
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Show project/budget/timeline only when interest type is selected
  const showExtendedFields = form.interestType !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    if (!form.interestType) return;

    setSubmitState('loading');
    setErrorMsg('');

    try {
      const channels: MarketingChannel[] = form.consentGranted ? ['EMAIL', 'WHATSAPP', 'SMS'] : [];
      const budget = form.budgetIndex !== '' ? BUDGET_RANGES[Number(form.budgetIndex)] : undefined;

      await LeadService.submitLead({
        source: 'WEBSITE_FORM',
        sourceDetail: {
          utmSource: 'website_form',
          ...(form.propertyLocation ? { utmCampaign: form.propertyLocation } : {}),
          ...(form.consultationMode ? { utmMedium: form.consultationMode } : {}),
        },
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        interestType: form.interestType as LeadInterestType,
        ...(form.projectType ? { projectType: form.projectType as LeadProjectType } : {}),
        ...(budget ? { budgetRange: { min: budget.min, max: budget.max } } : {}),
        ...(form.timeline ? { timeline: form.timeline as LeadTimeline } : {}),
        marketingConsent: {
          granted: form.consentGranted,
          source: 'website_form',
          channels,
        },
        // Mock CAPTCHA — real hCaptcha integration is a Phase 3 hardening task
        captchaToken: 'mock-captcha-token-for-dev',
      });

      setSubmitState('success');
    } catch (err: unknown) {
      setSubmitState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitState === 'success') {
    const firstName = form.name.trim().split(' ')[0] || 'Esteemed Patron';
    const whatsappMsg = encodeURIComponent(
      `Hello National Furniture & Interiors team, I just requested a complimentary 3D architectural consultation for my property (${form.phone}).`
    );

    return (
      <div className={`text-center py-8 px-6 ${compact ? '' : 'max-w-lg mx-auto'} bg-white rounded-xl`}>
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
          Consultation Request Confirmed, {firstName}!
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-6">
          A Senior Interior Architect has been assigned to your project. We will connect with you via Call / WhatsApp at <strong className="text-gray-900">{form.phone}</strong> within <strong className="text-emerald-700">2 business hours</strong> with a curated digital lookbook and to schedule your spatial audit.
        </p>

        {/* Next Steps Card */}
        <div className="bg-[#FAF9F6] border border-[#EBE8E3] rounded-xl p-4 text-left space-y-2 mb-6 text-xs text-gray-600">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#8C7355]" />
            <span>What happens next:</span>
          </div>
          <p className="pl-6 text-[11px] text-gray-500">
            1. Pre-audit review of your layout priorities &amp; timeline.
          </p>
          <p className="pl-6 text-[11px] text-gray-500">
            2. Complimentary 3D BIM spatial visualization (Save ₹25,000).
          </p>
          <p className="pl-6 text-[11px] text-gray-500">
            3. Guaranteed fixed-budget material estimate with zero hidden costs.
          </p>
        </div>

        {/* Direct Concierge Connect */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/919663628302?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Connect on WhatsApp Now</span>
          </a>
          <a
            href="tel:+919663628302"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Direct Concierge: +91 96636 28302</span>
          </a>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  const inputClass = 'w-full border border-gray-200 text-sm px-4 py-3 focus:outline-none focus:border-black transition-colors bg-white placeholder:text-gray-400';
  const labelClass = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5';
  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-5 max-w-xl'} noValidate>
      {/* Row 1: Name + Phone */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div>
          <label htmlFor="lead-name" className={labelClass}>
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Priya Sharma"
            className={inputClass}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="lead-phone" className={labelClass}>
            Phone <span className="text-red-400">*</span>
          </label>
          <input
            id="lead-phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className={inputClass}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="lead-email" className={labelClass}>Email</label>
        <input
          id="lead-email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="priya@example.com"
          className={inputClass}
          autoComplete="email"
        />
      </div>

      {/* Interest type */}
      <div>
        <label htmlFor="lead-interest" className={labelClass}>
          I&apos;m interested in <span className="text-red-400">*</span>
        </label>
        <select
          id="lead-interest"
          required
          value={form.interestType}
          onChange={(e) => set('interestType', e.target.value)}
          className={selectClass}
        >
          <option value="">Select an option…</option>
          {(Object.entries(INTEREST_LABELS) as [LeadInterestType, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Extended fields — shown only after interest is picked */}
      {showExtendedFields && (
        <>
          {/* Project type */}
          <div>
            <label htmlFor="lead-project" className={labelClass}>Project Type</label>
            <select
              id="lead-project"
              value={form.projectType}
              onChange={(e) => set('projectType', e.target.value)}
              className={selectClass}
            >
              <option value="">Select project type…</option>
              {(Object.entries(PROJECT_TYPE_LABELS) as [LeadProjectType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Budget + Timeline side by side */}
          <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
            <div>
              <label htmlFor="lead-budget" className={labelClass}>Approximate Budget</label>
              <select
                id="lead-budget"
                value={form.budgetIndex}
                onChange={(e) => set('budgetIndex', e.target.value)}
                className={selectClass}
              >
                <option value="">Select a range…</option>
                {BUDGET_RANGES.map((r, i) => (
                  <option key={i} value={i}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lead-timeline" className={labelClass}>Timeline</label>
              <select
                id="lead-timeline"
                value={form.timeline}
                onChange={(e) => set('timeline', e.target.value)}
                className={selectClass}
              >
                <option value="">When do you plan to start?</option>
                {(Object.entries(TIMELINE_LABELS) as [LeadTimeline, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Bengaluru Specific Fields */}
          {showBangaloreFields && (
            <div className={`grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
              <div>
                <label htmlFor="lead-bengaluru-loc" className={labelClass}>Property Location (Bengaluru)</label>
                <select
                  id="lead-bengaluru-loc"
                  value={form.propertyLocation}
                  onChange={(e) => set('propertyLocation', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select area in Bengaluru…</option>
                  {BENGALURU_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lead-consult-mode" className={labelClass}>Consultation Preference</label>
                <select
                  id="lead-consult-mode"
                  value={form.consultationMode}
                  onChange={(e) => set('consultationMode', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Where should we meet?</option>
                  {CONSULTATION_MODES.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Marketing consent */}
      <div className="flex items-start gap-3 pt-1">
        <input
          id="lead-consent"
          type="checkbox"
          checked={form.consentGranted}
          onChange={(e) => set('consentGranted', e.target.checked)}
          className="mt-0.5 flex-shrink-0 border-gray-300 text-black focus:ring-black w-4 h-4 cursor-pointer"
        />
        <label htmlFor="lead-consent" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
          I agree to receive updates about my enquiry via WhatsApp, SMS, and Email. You may
          withdraw consent at any time. (DPDP Act 2023 compliant)
        </label>
      </div>

      {/* Error */}
      {submitState === 'error' && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-3">
          {errorMsg || 'Something went wrong. Please try again.'}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitState === 'loading' || !form.name || !form.phone || !form.interestType}
        className={`w-full py-4 text-xs sm:text-sm uppercase tracking-wider font-bold transition-all rounded-lg ${
          submitState === 'loading'
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : !form.name || !form.phone || !form.interestType
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-[#171717] hover:bg-black text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] active:scale-[0.98] shadow-lg hover:shadow-xl'
        }`}
      >
        {submitState === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Submitting Details…
          </span>
        ) : (
          'Book Complimentary 3D Design Consultation (Save ₹25,000)'
        )}
      </button>

      <p className="text-[11px] text-gray-500 text-center font-medium">
        Senior Architect Connect Within 2 Hours · Free 3D Concept Layout · 100% Privacy Assured
      </p>
    </form>
  );
}
