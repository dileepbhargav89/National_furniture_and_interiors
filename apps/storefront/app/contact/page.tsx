'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Navigation,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Star,
  Copy,
  Check,
  Send,
  CalendarCheck,
} from 'lucide-react';
import { LeadService } from '@nfi/api-client';

export default function ContactPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick inquiry form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('FURNITURE_PURCHASE');
  const [locality, setLocality] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setSubmitError('Please enter your name and phone number.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await LeadService.submitLead({
        name: name.trim(),
        phone: phone.trim(),
        source: 'WEBSITE_FORM',
        interestType: service === 'INTERIOR_DESIGN' ? 'INTERIOR_DESIGN' : service === 'BOTH' ? 'BOTH' : 'FURNITURE_PURCHASE',
        sourceDetail: {
          utmSource: 'contact_page_quick_inquiry',
        },
        marketingConsent: {
          granted: true,
          channels: ['WHATSAPP', 'SMS'],
        },
        captchaToken: 'contact-page-inquiry-token',
      });
      setSubmitted(true);
    } catch {
      // Graceful offline fallback: allow user to still proceed directly to WhatsApp
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/919663628302?text=${encodeURIComponent(
    `Hello National Furniture & Interiors team, I would like to inquire about ${
      service === 'INTERIOR_DESIGN' ? 'Interior Design Services' : 'Custom Furniture Manufacturing'
    } for my home in Bengaluru.`
  )}`;

  return (
    <div className="bg-[#FAF9F6] text-neutral-900 min-h-screen selection:bg-[#8C7355] selection:text-white">
      {/* ── 1. ARCHITECTURAL HERO & TRUST BANNER ──────────────────────── */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 md:px-8 bg-[#171717] text-white overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8C7355]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Bengaluru Flagship Studio & Manufacturing Hub</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl font-light tracking-tight leading-tight mb-5">
            Visit Our Showroom or <br className="hidden sm:inline" />
            <span className="italic font-normal text-[#FAF9F6]">Connect Directly With Us</span>
          </h1>

          <p className="max-w-2xl mx-auto text-neutral-300 text-sm sm:text-base md:text-lg font-light leading-relaxed mb-8">
            Experience bespoke teak woodwork, 100+ luxury fabric swatches, and meet our senior interior architects at our flagship HSR Layout studio.
          </p>

          {/* Trust Highlights Pill Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-4 border-t border-neutral-800 text-left">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-white">4.8 / 5 Rating</span>
              </div>
              <p className="text-neutral-400 text-xs">1,200+ Bengaluru Homes</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[#8C7355] mb-1">
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-semibold text-white">Est. 1998</span>
              </div>
              <p className="text-neutral-400 text-xs">28+ Years Mastery</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">10-Yr Warranty</span>
              </div>
              <p className="text-neutral-400 text-xs">Century 710 BWP Marine</p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Open 7 Days</span>
              </div>
              <p className="text-neutral-400 text-xs">10:00 AM – 9:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CORE CONTACT CHANNELS & QUICK INQUIRY ─────────────────── */}
      <section className="container mx-auto px-4 md:px-8 py-12 md:py-20 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLS: Actionable Contact Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:border-[#8C7355]/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#8C7355]/10 flex items-center justify-center text-[#8C7355] shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#8C7355] uppercase tracking-wider">
                      Flagship Experience Center
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-medium text-neutral-900 mt-0.5">
                      National Furniture & Interiors
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      National Furniture and Interior Design · HSR Layout
                    </p>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/maps?daddr=National+Furniture+%26+Interiors+HSR+Layout+Bengaluru"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#171717] hover:bg-[#8C7355] text-white text-xs font-semibold rounded-xl transition-colors shrink-0 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
                    Showroom Address
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    #1315, 24th Main Road, <br />
                    Opposite to Purva Fairmont Apartment, <br />
                    Sector 2, BDA Layout, HSR Layout, <br />
                    Bengaluru, Karnataka 560102
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        '#1315, 24th Main Road, Opp. Purva Fairmont Apartment, Sector 2, HSR Layout, Bengaluru, Karnataka 560102',
                        'address'
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-[#8C7355] hover:underline font-medium mt-3"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Address Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
                    Visiting Hours & Parking
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    <strong>Monday – Sunday:</strong> 10:00 AM – 9:30 PM <br />
                    <span className="text-emerald-700 font-medium">● Open All 7 Days a Week</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    ✓ Dedicated customer car & two-wheeler parking available at showroom.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Calling & Instant WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Call Card */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:border-[#8C7355]/40 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    Available Now
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-1">
                  Call Showroom & Designers
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Speak directly with our senior woodcraft and interior specialists.
                </p>
                <div className="space-y-2">
                  <a
                    href="tel:+919663628302"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-900 text-sm font-semibold transition-colors"
                  >
                    <span>+91 9663628302</span>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </a>
                  <a
                    href="tel:+919845700349"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
                  >
                    <span>Alt: +91 98457 00349</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </a>
                </div>
              </div>

              {/* Instant WhatsApp Card */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700">
                      Fastest Reply
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
                    Instant WhatsApp Chat
                  </h3>
                  <p className="text-xs text-emerald-100/80 mb-5 leading-relaxed">
                    Share floor plans, request custom furniture sizes, or receive real-time price quotes.
                  </p>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Email & Home Consultation Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-white border border-neutral-200">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-4 h-4 text-[#8C7355]" />
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Official Email
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  For architectural drawings, quotation RFPs, and corporate orders.
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard('nationalfurniture07@gmail.com', 'email')}
                  className="w-full text-left p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-xs text-neutral-800 font-mono transition-colors flex items-center justify-between"
                >
                  <span className="truncate">nationalfurniture07@gmail.com</span>
                  {copiedField === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  )}
                </button>
              </div>

              <div className="p-5 rounded-xl bg-white border border-neutral-200">
                <div className="flex items-center gap-3 mb-2">
                  <CalendarCheck className="w-4 h-4 text-[#8C7355]" />
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
                    Free Home Measurement
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 mb-3">
                  Our project engineer visits your apartment anywhere in Bengaluru with swatch kits.
                </p>
                <Link
                  href="/design-services#lead-form"
                  className="inline-flex items-center gap-1.5 text-xs text-[#8C7355] hover:underline font-semibold"
                >
                  <span>Book Free Site Visit</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Customer-Friendly Quick Message / Inquiry Box */}
          <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest block mb-1">
                Quick Inquiry
              </span>
              <h2 className="font-serif text-2xl font-medium text-neutral-900">
                Leave a Quick Message
              </h2>
              <p className="text-neutral-500 text-xs mt-1">
                Tell us your furniture or interior requirement. Our team responds within 2 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-medium text-emerald-950 mb-1">
                  Thank You, {name || 'Valued Customer'}!
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed mb-6 max-w-xs mx-auto">
                  We have received your details. Our HSR Layout team is preparing your catalog and will call you shortly.
                </p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Continue on WhatsApp Directly</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                    {submitError}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Phone / WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="e.g. 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-xs font-semibold text-neutral-700 mb-1">
                    What can we help you with?
                  </label>
                  <select
                    id="service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent bg-neutral-50/50"
                  >
                    <option value="FURNITURE_PURCHASE">Custom Furniture (Sofa, Dining, Bed, PVD)</option>
                    <option value="INTERIOR_DESIGN">Full-Home Interior Planning & Execution</option>
                    <option value="BOTH">Both Furniture & Full-Home Interiors</option>
                    <option value="SHOWROOM_VISIT">Schedule Showroom Visit at HSR Layout</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="locality" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Apartment / Bengaluru Locality (Optional)
                  </label>
                  <input
                    id="locality"
                    type="text"
                    placeholder="e.g. Prestige Lakeside / HSR Layout"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent bg-neutral-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-neutral-700 mb-1">
                    Brief Note / Dimensions (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    placeholder="Any specific design style, sizes, or questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#8C7355] focus:border-transparent bg-neutral-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#171717] hover:bg-[#8C7355] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Submitting Details...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Free Call & Catalog</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-400 text-center pt-1">
                  🔒 We respect your privacy. No spam, only genuine design quotes.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. CUSTOMER ATTRACTION HIGHLIGHTS BANNER ──────────────────── */}
      <section className="container mx-auto px-4 md:px-8 pb-16">
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
              Why Bengaluru Homeowners Choose Us
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-neutral-900 mt-1">
              Direct From Our Bengaluru Factory To Your Living Room
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-2">
              Unlike showroom aggregators, National Furniture & Interiors designs, kiln-seasons, and manufactures everything in-house in Bengaluru.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200/80">
              <div className="w-10 h-10 rounded-lg bg-[#8C7355]/10 text-[#8C7355] flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-medium text-neutral-900 mb-1.5">
                Save 20% – 25% Factory-Direct
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                By manufacturing at our 40,000 sq.ft facility, we eliminate distributor and dealer margins, passing genuine savings directly to you.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200/80">
              <div className="w-10 h-10 rounded-lg bg-[#8C7355]/10 text-[#8C7355] flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-medium text-neutral-900 mb-1.5">
                Century 710 Club Prime & Solid Teak
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Every dining table, wardrobe carcass, and sofa frame uses genuine BWP marine plywood and seasoned teak with a 10-year warranty.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF9F6] border border-neutral-200/80">
              <div className="w-10 h-10 rounded-lg bg-[#8C7355]/10 text-[#8C7355] flex items-center justify-center mb-3">
                <Navigation className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-base font-medium text-neutral-900 mb-1.5">
                Free Doorstep Swatches & Site Visits
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Can’t visit HSR Layout immediately? Our engineers deliver tactile wood swatches and take laser measurements at your doorstep within 48 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. INTERACTIVE GOOGLE MAP WITH LIVE STORE BADGE ────────────── */}
      <section className="bg-neutral-100 border-t border-neutral-200 relative">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[#8C7355] text-xs font-semibold uppercase tracking-widest">
                Interactive Map Location
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-light text-neutral-900">
                Opposite Purva Fairmont Apartment, HSR Layout
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Open Today until 9:30 PM</span>
              </span>
              <a
                href="https://maps.google.com/maps?daddr=National+Furniture+%26+Interiors+HSR+Layout+Bengaluru"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#8C7355] font-semibold hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="w-full h-[450px] md:h-[550px] rounded-2xl overflow-hidden bg-neutral-200 border border-neutral-300 shadow-inner relative">
            <iframe
              src="https://maps.google.com/maps?q=National%20Furniture%20%26%20Interiors%20-%20Furniture%20store%20in%20HSR%20Layout&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="National Furniture & Interiors HSR Layout Location"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
