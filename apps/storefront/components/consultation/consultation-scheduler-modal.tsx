'use client';

import React, { useState, useMemo } from 'react';
import {
  LeadService,
  ConsultationBooking,
  ConsultationType,
  LeadInterestType,
  LeadProjectType,
} from '@nfi/api-client';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Home,
  CheckCircle2,
  Download,
  MessageCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export interface ConsultationSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: ConsultationType;
  defaultStudio?:
    'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIKAS_MARG' | 'ON_SITE' | 'VIRTUAL';
}

interface StudioOption {
  id: string;
  type: ConsultationType;
  studioLocation?:
    'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIKAS_MARG' | 'ON_SITE' | 'VIRTUAL';
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
}

const STUDIO_OPTIONS: StudioOption[] = [
  {
    id: 'indiranagar',
    type: 'STUDIO_VISIT',
    studioLocation: 'INDIRANAGAR',
    title: 'Indiranagar Flagship Studio',
    subtitle: '100ft Road · Material gallery, full-scale walk-in kitchen suites & living pods',
    badge: 'Premier Flagship',
    icon: <Building className="h-5 w-5 text-amber-600" />,
  },
  {
    id: 'whitefield',
    type: 'STUDIO_VISIT',
    studioLocation: 'WHITEFIELD',
    title: 'Whitefield Experience Centre',
    subtitle: 'ITPL Main Road · Penthouse joinery, bespoke wardrobes & Italian veneers',
    badge: 'East Bengaluru',
    icon: <Building className="h-5 w-5 text-amber-600" />,
  },
  {
    id: 'hsr',
    type: 'STUDIO_VISIT',
    studioLocation: 'HSR_LAYOUT',
    title: 'HSR Layout Studio',
    subtitle: 'Sector 4 · Modern minimalism, Blum hardware lab & acoustic panelling',
    badge: 'South Bengaluru',
    icon: <Building className="h-5 w-5 text-amber-600" />,
  },
  {
    id: 'vikas_marg',
    type: 'STUDIO_VISIT',
    studioLocation: 'VIKAS_MARG',
    title: 'Vikas Marg Experience Centre',
    subtitle: 'Luxury residential design studio & bespoke teak furniture lounge',
    badge: 'North & Pan-India',
    icon: <Building className="h-5 w-5 text-amber-600" />,
  },
  {
    id: 'on_site',
    type: 'ON_SITE_SURVEY',
    studioLocation: 'ON_SITE',
    title: 'On-Site Residence Audit',
    subtitle:
      'Senior Architect visits your Bengaluru flat/villa for laser measurements & layout assessment',
    badge: 'Bengaluru Only',
    icon: <Home className="h-5 w-5 text-emerald-600" />,
  },
  {
    id: 'virtual',
    type: 'VIRTUAL_VIDEO_CALL',
    studioLocation: 'VIRTUAL',
    title: 'Virtual 3D Video Consultation',
    subtitle: 'Live 1-on-1 screen share with 3D BIM walkthrough via Zoom / Google Meet',
    badge: 'Worldwide & Pan-India',
    icon: <Video className="h-5 w-5 text-blue-600" />,
  },
];

const TIME_SLOTS = [
  { group: 'Morning', slots: ['10:30 AM - 12:00 PM', '11:30 AM - 01:00 PM'] },
  { group: 'Afternoon', slots: ['02:30 PM - 04:00 PM', '04:00 PM - 05:30 PM'] },
  { group: 'Evening', slots: ['05:30 PM - 07:00 PM', '06:30 PM - 08:00 PM'] },
];

export function ConsultationSchedulerModal({
  isOpen,
  onClose,
  defaultMode = 'STUDIO_VISIT',
  defaultStudio = 'INDIRANAGAR',
}: ConsultationSchedulerModalProps) {
  // Wizard steps: 1 = Studio/Mode, 2 = Date & Time, 3 = Patron Info, 4 = Confirmed
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selection state
  const initialStudioId =
    defaultMode === 'VIRTUAL_VIDEO_CALL'
      ? 'virtual'
      : defaultMode === 'ON_SITE_SURVEY'
        ? 'on_site'
        : (defaultStudio || 'INDIRANAGAR').toLowerCase();

  const [selectedStudioId, setSelectedStudioId] = useState<string>(initialStudioId);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:30 AM - 01:00 PM');

  // Patron info
  const [patronName, setPatronName] = useState('');
  const [patronPhone, setPatronPhone] = useState('');
  const [patronEmail, setPatronEmail] = useState('');
  const [propertyCommunity, setPropertyCommunity] = useState('');
  const [projectType, setProjectType] = useState<LeadProjectType>('RESIDENTIAL');
  const [notes, setNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bookedBooking, setBookedBooking] = useState<ConsultationBooking | null>(null);

  // Generate next 14 calendar dates
  const availableDates = useMemo(() => {
    const dates: { iso: string; dayName: string; dayNum: number; monthName: string }[] = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      // Skip Sundays if studio is closed for deep sanitization
      if (d.getDay() === 0) continue;

      const iso = d.toISOString().split('T')[0] || '';
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
      dates.push({ iso, dayName, dayNum, monthName });
    }
    return dates;
  }, []);

  // Initialize selected date if empty
  React.useEffect(() => {
    if (availableDates.length > 0 && availableDates[0]?.iso && !selectedDate) {
      setSelectedDate(availableDates[0].iso);
    }
  }, [availableDates, selectedDate]);

  if (!isOpen) return null;

  const fallbackStudio: StudioOption = STUDIO_OPTIONS[0] as StudioOption;
  const activeStudio: StudioOption =
    STUDIO_OPTIONS.find((s) => s.id === selectedStudioId) ?? fallbackStudio;

  // Submit Booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patronName.trim() || !patronPhone.trim()) {
      setErrorMessage('Please enter your full name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const booking: ConsultationBooking = {
      consultationType: activeStudio.type,
      studioLocation: activeStudio.studioLocation,
      scheduledDate: selectedDate,
      timeSlot: selectedTimeSlot,
      propertyType: projectType,
      meetingNotes: notes.trim() || undefined,
      calendarInviteSent: true,
    };

    try {
      await LeadService.submitLead({
        source: 'WEBSITE_FORM',
        sourceDetail: {
          utmSource: 'consultation_scheduler',
          utmMedium: activeStudio.id,
          utmCampaign: propertyCommunity || 'Bengaluru Luxury',
        },
        name: patronName.trim(),
        phone: patronPhone.trim(),
        ...(patronEmail.trim() ? { email: patronEmail.trim() } : {}),
        interestType: 'INTERIOR_DESIGN' as LeadInterestType,
        projectType,
        budgetRange: { min: 1000000, max: 3500000 },
        timeline: 'IMMEDIATE',
        consultationBooking: booking,
        marketingConsent: {
          granted: true,
          source: 'consultation_scheduler',
          channels: ['WHATSAPP', 'SMS', 'EMAIL'],
        },
        captchaToken: 'mock-consultation-captcha-token',
      });

      setBookedBooking(booking);
      setStep(4);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate RFC 5545 .ics calendar invite
  const downloadCalendarIcs = () => {
    if (!bookedBooking || !bookedBooking.scheduledDate) return;
    const cleanDate = bookedBooking.scheduledDate.replace(/-/g, '');
    const startTimeStr = (bookedBooking.timeSlot || '11:00 AM').split(' - ')[0] || '11:00 AM';

    // Parse time to UTC-approximate format for ICS
    const parts = startTimeStr.split(' ');
    const timePart = parts[0] || '11:00';
    const modifier = parts[1] || 'AM';
    const timeSubParts = timePart.split(':');
    const hoursStr = timeSubParts[0] || '11';
    const minutesStr = timeSubParts[1] || '00';
    let hours = parseInt(hoursStr, 10) || 11;
    const minutes = parseInt(minutesStr, 10) || 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const startH = hours < 10 ? `0${hours}` : `${hours}`;
    const startM = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const endH = hours + 1 < 10 ? `0${hours + 1}` : `${hours + 1}`;

    const locationStr =
      bookedBooking.studioLocation === 'VIRTUAL'
        ? 'Virtual 3D Video Call (Zoom / Google Meet)'
        : bookedBooking.studioLocation === 'INDIRANAGAR'
          ? 'National Furniture & Interiors — Flagship Studio, 100ft Rd, Indiranagar, Bengaluru'
          : bookedBooking.studioLocation === 'WHITEFIELD'
            ? 'National Furniture & Interiors — Experience Studio, ITPL Main Rd, Whitefield, Bengaluru'
            : bookedBooking.studioLocation === 'HSR_LAYOUT'
              ? 'National Furniture & Interiors — Design Studio, Sector 4, HSR Layout, Bengaluru'
              : 'National Furniture & Interiors — Experience Centre';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//National Furniture and Interiors//Design Consultation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:nfi-${Date.now()}@nationalinteriors.in`,
      `DTSTAMP:${cleanDate}T100000Z`,
      `DTSTART:${cleanDate}T${startH}${startM}00`,
      `DTEND:${cleanDate}T${endH}${startM}00`,
      `SUMMARY:National Furniture & Interiors — Design Consultation (${bookedBooking.studioLocation || 'Studio'})`,
      `DESCRIPTION:Design Consultation with Senior Interior Architect for ${patronName}. Location: ${locationStr}. Inquiries: +91 96636 28302`,
      `LOCATION:${locationStr}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NFI-Consultation-${bookedBooking.scheduledDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pre-filled WhatsApp concierge message
  const getWhatsAppConciergeUrl = () => {
    if (!bookedBooking) return 'https://wa.me/919663628302';
    const cleanPhone = (patronPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const location =
      bookedBooking.studioLocation === 'VIRTUAL'
        ? 'Virtual 3D Video Call'
        : `${bookedBooking.studioLocation || 'Indiranagar'} Experience Studio`;

    const text = encodeURIComponent(
      `Hello National Furniture & Interiors team! I have scheduled my design consultation for ${bookedBooking.scheduledDate} at ${bookedBooking.timeSlot} (${location}). My contact is +${phoneWithCountry}. Looking forward to reviewing concepts with the architect.`,
    );
    return `https://wa.me/919663628302?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl duration-200">
        {/* Header Strip */}
        <div className="relative bg-stone-950 p-5 text-white sm:p-6">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-1 text-stone-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Complimentary 3D Architectural Consultation</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
            Schedule Your Design Session
          </h2>
          <p className="mt-1 max-w-lg text-xs text-stone-300 sm:text-sm">
            Experience tactile woodwork samples, review your floor plan with a Senior Architect, and
            lock in guaranteed factory-direct pricing.
          </p>

          {/* Progress Indicator */}
          {step < 4 && (
            <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-stone-400">
              <span className={`font-semibold ${step >= 1 ? 'text-amber-300' : ''}`}>
                1. Studio &amp; Mode
              </span>
              <span>→</span>
              <span className={`font-semibold ${step >= 2 ? 'text-amber-300' : ''}`}>
                2. Date &amp; Slot
              </span>
              <span>→</span>
              <span className={`font-semibold ${step >= 3 ? 'text-amber-300' : ''}`}>
                3. Your Details
              </span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-6">
          {/* STEP 1: STUDIO & MODE SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700">
                Choose Consultation Experience
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {STUDIO_OPTIONS.map((opt) => {
                  const isSelected = selectedStudioId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedStudioId(opt.id)}
                      className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-1 ring-amber-600'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="rounded-lg bg-stone-100 p-1.5">{opt.icon}</span>
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-700">
                            {opt.badge}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-900">{opt.title}</h4>
                        <p className="mt-1 text-xs leading-snug text-stone-500">{opt.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 rounded-xl bg-[#8C7355] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#786144]"
                >
                  <span>Select Date &amp; Time</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME SLOT PICKER */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-stone-700">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span>Select Appointment Date</span>
                  </h3>
                  <span className="text-xs font-medium text-stone-500">Next 14 Days</span>
                </div>

                {/* Horizontal Date Picker */}
                <div className="grid grid-cols-4 gap-2 overflow-x-auto pb-1 sm:grid-cols-7">
                  {availableDates.map((d) => {
                    const isSelected = selectedDate === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDate(d.iso)}
                        className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 font-bold text-white shadow-md'
                            : 'border-stone-200 bg-white text-stone-800 hover:border-amber-300'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}
                        >
                          {d.dayName}
                        </span>
                        <span className="my-0.5 text-base font-bold">{d.dayNum}</span>
                        <span
                          className={`text-[10px] ${isSelected ? 'text-amber-100' : 'text-stone-500'}`}
                        >
                          {d.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-stone-700">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>Choose Time Slot (IST)</span>
                </h3>

                <div className="space-y-3">
                  {TIME_SLOTS.map((grp) => (
                    <div key={grp.group}>
                      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                        {grp.group}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {grp.slots.map((slot) => {
                          const isSelected = selectedTimeSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`rounded-lg border px-3 py-2.5 text-center text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'shadow-xs border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold uppercase text-stone-500 hover:text-stone-800"
                >
                  ← Back to Studios
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 rounded-xl bg-[#8C7355] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#786144]"
                >
                  <span>Continue to Details</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PATRON DETAILS & CONFIRMATION */}
          {step === 3 && (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Summary Pill */}
              <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-700" />
                  <span>
                    <strong>{activeStudio.title}</strong> · {selectedDate} ({selectedTimeSlot})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-[11px] font-bold text-amber-800 underline hover:text-amber-900"
                >
                  Change
                </button>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patronName}
                    onChange={(e) => setPatronName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                    Phone Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={patronPhone}
                    onChange={(e) => setPatronPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={patronEmail}
                    onChange={(e) => setPatronEmail(e.target.value)}
                    placeholder="vikram@domain.com"
                    className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                    Property / Locality
                  </label>
                  <input
                    type="text"
                    value={propertyCommunity}
                    onChange={(e) => setPropertyCommunity(e.target.value)}
                    placeholder="e.g. Prestige Golfshire / Indiranagar"
                    className="w-full rounded-lg border border-stone-200 px-3.5 py-2.5 text-xs focus:border-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Scope of Design
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as LeadProjectType)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs focus:border-stone-900 focus:outline-none"
                >
                  <option value="RESIDENTIAL">Full Home Turnkey Interiors</option>
                  <option value="MODULAR_KITCHEN">Bespoke Modular Kitchen &amp; Wardrobes</option>
                  <option value="LIVING_ROOM">Living &amp; Dining Suite</option>
                  <option value="COMMERCIAL">Commercial Office / Boutique Store</option>
                  <option value="HOTEL">Boutique Hospitality</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                  Architectural Notes / Specific Priorities (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need solid Burma teak dining table and walk-in wardrobe; possession in December."
                  className="w-full rounded-lg border border-stone-200 px-3.5 py-2 text-xs focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold uppercase text-stone-500 hover:text-stone-800"
                >
                  ← Back to Slot
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-700 px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Confirming Reservation...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Lock In Consultation Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: INSTANT BOOKING CONFIRMED */}
          {step === 4 && bookedBooking && (
            <div className="space-y-5 px-2 py-4 text-center">
              <div className="shadow-xs mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  Confirmed Reservation · National Furniture &amp; Interiors
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  Appointment Locked, {patronName.split(' ')[0]}!
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-stone-600">
                  Our Senior Interior Architect has reserved this time exclusively for your project
                  discussion.
                </p>
              </div>

              {/* Booking Dossier Card */}
              <div className="shadow-2xs mx-auto max-w-md space-y-2 rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 text-left text-xs text-stone-700">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Location / Mode:</span>
                  <span className="font-bold text-stone-900">{activeStudio.title}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Date:</span>
                  <span className="font-bold text-stone-900">{bookedBooking.scheduledDate}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-500">Time Window:</span>
                  <span className="font-bold text-emerald-800">{bookedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Patron Phone:</span>
                  <span className="font-mono text-stone-900">{patronPhone}</span>
                </div>
              </div>

              {/* Action Buttons: Calendar + WhatsApp */}
              <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={downloadCalendarIcs}
                  className="shadow-2xs flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-5 py-3 text-xs font-semibold text-stone-800 transition-all hover:bg-stone-50 sm:w-auto"
                >
                  <Download className="h-4 w-4 text-stone-600" />
                  <span>Add to Apple / Outlook (.ics)</span>
                </button>

                <a
                  href={getWhatsAppConciergeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-800 sm:w-auto"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Confirm on WhatsApp Concierge</span>
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Zero obligation · 45-day handover guarantee · Direct factory rates</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
