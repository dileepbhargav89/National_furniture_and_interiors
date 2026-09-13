import { describe, it, expect } from 'vitest';
import type { 
  PipelineStageId, 
  SalesRepresentative, 
  ClientTier 
} from '@nfi/api-client';

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
  const phoneWithCountry = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
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
});
