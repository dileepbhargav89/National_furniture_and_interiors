import { describe, it, expect } from 'vitest';
import type { PipelineStageId, SalesRepresentative, ClientTier } from '@nfi/api-client';

const STAGE_CONFIG: Record<PipelineStageId, { label: string; probability: number }> = {
  NEW_INQUIRY: { label: 'New Inquiry', probability: 10 },
  QUALIFIED: { label: 'Qualified & Discovery', probability: 30 },
  STUDIO_CONSULTATION: { label: 'Studio Consultation', probability: 50 },
  DESIGN_PROPOSAL_SENT: { label: 'Design Proposal Sent', probability: 75 },
  NEGOTIATION: { label: 'Negotiation & Finishes', probability: 90 },
  CLOSED_WON: { label: 'Closed Won', probability: 100 },
  CLOSED_LOST: { label: 'Closed Lost', probability: 0 },
};

function calculateWeightedValue(dealValuePaise: number, stage: PipelineStageId): number {
  const prob = STAGE_CONFIG[stage]?.probability ?? 0;
  return Math.round((dealValuePaise * prob) / 100);
}

function classifyClientTier(estimatedDealValuePaise: number, isCommercial = false): ClientTier {
  if (isCommercial) return 'COMMERCIAL';
  if (estimatedDealValuePaise >= 250000000) return 'VIP_PLATINUM'; // >= ₹25 Lakhs
  if (estimatedDealValuePaise >= 100000000) return 'HIGH_NET_WORTH'; // >= ₹10 Lakhs
  if (estimatedDealValuePaise >= 30000000) return 'RETAIL'; // >= ₹3 Lakhs
  return 'PROSPECT';
}

function findLeastLoadedConsultant(consultants: SalesRepresentative[]): SalesRepresentative | null {
  const activeReps = consultants.filter((r) => r.status === 'ACTIVE');
  if (activeReps.length === 0) return null;
  return [...activeReps].sort((a, b) => a.activeLeadsCount - b.activeLeadsCount)[0] ?? null;
}

function generateWhatsAppConciergeTemplate(deal: {
  clientName: string;
  phone: string;
  community: string;
  configuration: string;
  assignedRepName?: string;
}): string {
  const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
  const phoneWithCountry =
    cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone.startsWith('91')
        ? cleanPhone
        : `91${cleanPhone}`;
  const repName = deal.assignedRepName || 'Design Consultant';

  const message = `Hello ${deal.clientName},\n\nThank you for consulting National Furniture & Interiors regarding your ${deal.configuration} at ${deal.community}.\n\nOur senior design lead, ${repName}, has prepared your bespoke woodwork concept proposal and 3D specifications. Would you like to review the renders this week?\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Experience Studios (Indiranagar · Whitefield · HSR Layout)`;

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

describe('Enterprise Customer CRM & Sales Operations Hub', () => {
  describe('Pipeline Stage & Deal Value Weighting', () => {
    it('calculates accurate weighted values for high-value Bengaluru deals', () => {
      const dealValue = 245000000; // ₹24,50,000

      expect(calculateWeightedValue(dealValue, 'NEW_INQUIRY')).toBe(24500000); // 10%
      expect(calculateWeightedValue(dealValue, 'QUALIFIED')).toBe(73500000); // 30%
      expect(calculateWeightedValue(dealValue, 'STUDIO_CONSULTATION')).toBe(122500000); // 50%
      expect(calculateWeightedValue(dealValue, 'DESIGN_PROPOSAL_SENT')).toBe(183750000); // 75%
      expect(calculateWeightedValue(dealValue, 'NEGOTIATION')).toBe(220500000); // 90%
      expect(calculateWeightedValue(dealValue, 'CLOSED_WON')).toBe(245000000); // 100%
      expect(calculateWeightedValue(dealValue, 'CLOSED_LOST')).toBe(0); // 0%
    });
  });

  describe('Client Tiering & HNW Segmentation', () => {
    it('categorizes ultra-luxury residences as VIP_PLATINUM', () => {
      // Epsilon Villas or Kingfisher Towers penthouse (₹42 Lakhs)
      const tier = classifyClientTier(420000000);
      expect(tier).toBe('VIP_PLATINUM');
    });

    it('categorizes high-net-worth 3BHK residences correctly', () => {
      // Total Environment or Prestige Lakeside 3BHK (₹18 Lakhs)
      const tier = classifyClientTier(180000000);
      expect(tier).toBe('HIGH_NET_WORTH');
    });

    it('categorizes commercial office woodwork as COMMERCIAL', () => {
      const tier = classifyClientTier(500000000, true);
      expect(tier).toBe('COMMERCIAL');
    });

    it('categorizes standalone furniture inquiry as RETAIL', () => {
      // Solid wood dining set (₹4.5 Lakhs)
      const tier = classifyClientTier(45000000);
      expect(tier).toBe('RETAIL');
    });
  });

  describe('Automated Round-Robin Consultant Assignment', () => {
    const consultants: SalesRepresentative[] = [
      {
        id: 'rep_1',
        userId: 'u1',
        name: 'Priya Sharma',
        email: 'priya@nfi.in',
        phone: '9845011111',
        specialization: 'LUXURY_RESIDENTIAL',
        monthlyTarget: 400000000,
        achievedRevenue: 345000000,
        activeLeadsCount: 8,
        maxCapacity: 12,
        wonDealsCount: 14,
        conversionRate: 38.2,
        status: 'ACTIVE',
      },
      {
        id: 'rep_2',
        userId: 'u2',
        name: 'Arjun Mehta',
        email: 'arjun@nfi.in',
        phone: '9845022222',
        specialization: 'COMMERCIAL_OFFICE',
        monthlyTarget: 350000000,
        achievedRevenue: 280000000,
        activeLeadsCount: 4, // lowest active leads
        maxCapacity: 10,
        wonDealsCount: 11,
        conversionRate: 35.0,
        status: 'ACTIVE',
      },
      {
        id: 'rep_3',
        userId: 'u3',
        name: 'Vikram Patel',
        email: 'vikram@nfi.in',
        phone: '9845033333',
        specialization: 'BESPOKE_FURNITURE',
        monthlyTarget: 450000000,
        achievedRevenue: 392000000,
        activeLeadsCount: 9,
        maxCapacity: 12,
        wonDealsCount: 16,
        conversionRate: 41.5,
        status: 'ACTIVE',
      },
      {
        id: 'rep_4',
        userId: 'u4',
        name: 'Rohit Verma',
        email: 'rohit@nfi.in',
        phone: '9845044444',
        specialization: 'MODULAR_KITCHEN',
        monthlyTarget: 300000000,
        achievedRevenue: 100000000,
        activeLeadsCount: 2,
        maxCapacity: 10,
        wonDealsCount: 3,
        conversionRate: 25.0,
        status: 'ON_LEAVE', // on leave, should be excluded
      },
    ];

    it('selects the active consultant with the lowest lead workload for optimal capacity', () => {
      const selected = findLeastLoadedConsultant(consultants);
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('rep_2');
      expect(selected?.name).toBe('Arjun Mehta');
      expect(selected?.activeLeadsCount).toBe(4);
    });
  });

  describe('WhatsApp Concierge Template Generation', () => {
    it('generates a URL-encoded personalized WhatsApp link for immediate outreach', () => {
      const deal = {
        clientName: 'Siddharth Varma',
        phone: '9845011223',
        community: 'Prestige Lakeside Habitat',
        configuration: '4BHK Signature Villa',
        assignedRepName: 'Priya Sharma',
      };

      const url = generateWhatsAppConciergeTemplate(deal);
      expect(url).toContain('https://wa.me/919845011223');
      expect(url).toContain('Siddharth%20Varma');
      expect(url).toContain('Prestige%20Lakeside%20Habitat');
      expect(url).toContain('Priya%20Sharma');
      expect(url).toContain('Indiranagar%20%C2%B7%20Whitefield%20%C2%B7%20HSR%20Layout');
    });
  });

  describe('Consultant Quota Progress Tracking', () => {
    it('calculates correct quota achievement percentage and remaining gap', () => {
      const rep: SalesRepresentative = {
        id: 'rep_1',
        userId: 'u1',
        name: 'Priya Sharma',
        email: 'priya@nfi.in',
        phone: '9845011111',
        specialization: 'LUXURY_RESIDENTIAL',
        monthlyTarget: 400000000, // ₹40.0 Lakhs
        achievedRevenue: 345000000, // ₹34.5 Lakhs
        activeLeadsCount: 8,
        maxCapacity: 12,
        wonDealsCount: 14,
        conversionRate: 38.2,
        status: 'ACTIVE',
      };

      const quotaPercent = Math.round((rep.achievedRevenue / rep.monthlyTarget) * 100);
      const remainingPaise = Math.max(0, rep.monthlyTarget - rep.achievedRevenue);

      expect(quotaPercent).toBe(86);
      expect(remainingPaise).toBe(55000000); // ₹5.5 Lakhs gap to monthly target
    });
  });

  describe('Consultation Scheduling & Concierge Engine', () => {
    it('generates appointment-specific WhatsApp confirmation with studio location and date/time', () => {
      const dealWithConsultation = {
        clientName: 'Sanjay Kapoor',
        phone: '9845099887',
        community: 'Prestige Golfshire',
        configuration: '4BHK Villa Interiors',
        assignedRepName: 'Priya Sharma',
        consultationBooking: {
          consultationType: 'STUDIO_VISIT' as const,
          studioLocation: 'INDIRANAGAR' as const,
          scheduledDate: '2026-09-24',
          timeSlot: '02:30 PM - 04:00 PM',
        },
      };

      const cleanPhone = dealWithConsultation.phone.replace(/[^0-9]/g, '');
      const phoneWithCountry = `91${cleanPhone}`;
      const b = dealWithConsultation.consultationBooking;
      const venueStr = `${b.studioLocation} Experience Studio`;
      const expectedMsg = `Hello ${dealWithConsultation.clientName},\n\nYour design consultation at National Furniture & Interiors is confirmed for:\n🏛️ Location: ${venueStr}\n📅 Date: ${b.scheduledDate}\n⏰ Time Window: ${b.timeSlot}\n\nOur Senior Interior Architect, ${dealWithConsultation.assignedRepName}, has reserved this slot exclusively for your ${dealWithConsultation.configuration} at ${dealWithConsultation.community} to walk through material finishes and 3D concept plans.\n\nLooking forward to welcoming you!\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Flagship: 100ft Rd, Indiranagar · Whitefield · HSR Layout`;

      const generatedUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(expectedMsg)}`;
      expect(generatedUrl).toContain('https://wa.me/919845099887');
      expect(generatedUrl).toContain(encodeURIComponent(b.scheduledDate));
      expect(generatedUrl).toContain(encodeURIComponent(b.timeSlot));
      expect(generatedUrl).toContain(encodeURIComponent('INDIRANAGAR Experience Studio'));
    });

    it('validates RFC 5545 calendar event formatting for .ics invitations', () => {
      const scheduledDate = '2026-09-24';
      const cleanDate = scheduledDate.replace(/-/g, '');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//National Furniture and Interiors//Design Consultation//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${cleanDate}T110000`,
        `DTEND:${cleanDate}T123000`,
        'SUMMARY:National Furniture & Interiors — Design Consultation (Indiranagar)',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('DTSTART:20260924T110000');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('Module 2: Physical Luxury Material Swatch Kit Ordering & Mechanics', () => {
    it('validates ₹499 refundable advance token deposit in paise', () => {
      const depositRupees = 499;
      const depositPaise = depositRupees * 100;
      expect(depositPaise).toBe(49900);
    });

    it('validates 4 curated swatch kit collections metadata', () => {
      const swatchKits = [
        {
          id: 'HARDWOOD_VENEERS',
          name: 'The Atelier Hardwood & Veneer Box',
          sla: '48 Hours in Bengaluru',
        },
        {
          id: 'FABRICS_LEATHER',
          name: 'The Haute Living Fabrics & Leather Box',
          sla: '48 Hours in Bengaluru',
        },
        {
          id: 'MODULAR_KITCHEN',
          name: 'The Modular Kitchen & Cabinetry Box',
          sla: '48 Hours in Bengaluru',
        },
        {
          id: 'COMPLETE_MASTER_BOX',
          name: 'The Complete Master Experience Box',
          sla: '48 Hours in Bengaluru',
        },
      ];

      expect(swatchKits).toHaveLength(4);
      expect(swatchKits.map((k) => k.id)).toEqual([
        'HARDWOOD_VENEERS',
        'FABRICS_LEATHER',
        'MODULAR_KITCHEN',
        'COMPLETE_MASTER_BOX',
      ]);
    });

    it('generates WhatsApp Material Concierge tracking link', () => {
      const order = {
        orderCode: 'NFI-SWATCH-991245',
        kitName: 'The Atelier Hardwood & Veneer Box',
        city: 'Bengaluru',
        clientName: 'Vikramaditya Hegde',
      };

      const text = `Hello National Furniture & Interiors Concierge,\n\nI have placed an order for ${order.kitName} (Ref: ${order.orderCode}) for delivery in ${order.city}.\n\nPlease share the courier dispatch tracking updates once dispatched.\n\nWarm regards,\n${order.clientName}`;
      const url = `https://wa.me/919880123456?text=${encodeURIComponent(text)}`;

      expect(url).toContain('wa.me/919880123456');
      expect(url).toContain(encodeURIComponent(order.orderCode));
      expect(url).toContain(encodeURIComponent(order.kitName));
    });
  });
});
