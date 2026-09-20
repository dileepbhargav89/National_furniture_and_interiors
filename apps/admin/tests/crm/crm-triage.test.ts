import { describe, it, expect } from 'vitest';
import type { PipelineDeal } from '@nfi/api-client';

// ── CRM Triage & Concierge Logic Harness (replicates apps/admin logic) ────

function getTimeAgo(dateStr?: string | Date): string {
  if (!dateStr) return 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function generateWhatsAppUrl(deal: {
  clientName: string;
  phone: string;
  configuration?: string | undefined;
  community?: string | undefined;
  assignedRepName?: string | undefined;
}): string {
  const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
  const phoneWithCountry =
    cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone.startsWith('91')
        ? cleanPhone
        : `91${cleanPhone}`;
  const message = `Hello ${deal.clientName},\n\nThank you for reaching out to National Furniture & Interiors. We received your inquiry regarding your ${deal.configuration || 'bespoke interior'} requirements${deal.community ? ` at ${deal.community}` : ''}.\n\nOur design consultant, ${deal.assignedRepName || 'a Senior Interior Architect'}, would be delighted to assist you with layout options and bespoke woodwork estimates.\n\nWhen would be a convenient time for a quick 10-minute consultation call?`;
  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

function filterDeals(
  deals: PipelineDeal[],
  filter: 'all' | 'today' | 'unassigned' | 'high_value',
  search = '',
): PipelineDeal[] {
  return deals.filter((deal) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        deal.clientName.toLowerCase().includes(q) ||
        (deal.phone && deal.phone.includes(q)) ||
        (deal.email && deal.email.toLowerCase().includes(q)) ||
        (deal.community && deal.community.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filter === 'today') {
      const dealTime = new Date(deal.createdAt || deal.updatedAt).getTime();
      return deal.stage === 'NEW_INQUIRY' && Date.now() - dealTime < 24 * 3600 * 1000;
    }

    if (filter === 'unassigned') {
      return !deal.assignedRepId || !deal.assignedRepName || deal.assignedRepName === 'Unassigned';
    }

    if (filter === 'high_value') {
      return deal.estimatedDealValue >= 150000000; // >= ₹15 Lakhs
    }

    return true;
  });
}

describe('Admin CRM Fast-Response Inquiries & Triage Suite', () => {
  const mockDeals: PipelineDeal[] = [
    {
      id: 'deal-1',
      customerId: 'cust-1',
      clientName: 'Dileep Bhargav',
      customerCode: 'C-001',
      community: 'Indiranagar Atelier',
      configuration: '4BHK Ultra-Luxury Penthouse',
      estimatedDealValue: 350000000, // ₹35 Lakhs
      weightedValue: 35000000,
      probability: 10,
      daysInStage: 0,
      stage: 'NEW_INQUIRY',
      priority: 'HOT',
      clientTier: 'VIP_PLATINUM',
      email: 'dileep@nationalinteriors.com',
      phone: '9109059791',
      assignedRepName: 'Priya Sharma',
      assignedRepId: 'rep-1',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'deal-2',
      customerId: 'cust-2',
      clientName: 'Anjali Sharma',
      customerCode: 'C-002',
      community: 'Whitefield',
      configuration: '3BHK Villa Woodwork',
      estimatedDealValue: 120000000, // ₹12 Lakhs
      weightedValue: 12000000,
      probability: 10,
      daysInStage: 0,
      stage: 'NEW_INQUIRY',
      priority: 'WARM',
      clientTier: 'HIGH_NET_WORTH',
      email: 'anjali@example.com',
      phone: '8817226540',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3h ago
      updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'deal-3',
      customerId: 'cust-3',
      clientName: 'Rahul Verma',
      customerCode: 'C-003',
      community: 'HSR Layout',
      configuration: 'Bespoke Dining Suite',
      estimatedDealValue: 45000000, // ₹4.5 Lakhs
      weightedValue: 4500000,
      probability: 10,
      daysInStage: 2,
      stage: 'NEW_INQUIRY',
      priority: 'COLD',
      clientTier: 'RETAIL',
      email: 'rahul@example.com',
      phone: '9845012345',
      assignedRepName: 'Rajesh Nair',
      assignedRepId: 'rep-2',
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), // 2d ago
      updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
  ];

  describe('SLA Time Elapsed Calculation', () => {
    it('accurately identifies recent inquiries in minutes and hours', () => {
      const now = new Date();
      expect(getTimeAgo(now)).toBe('Just now');

      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(getTimeAgo(tenMinsAgo)).toBe('10m ago');

      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
      expect(getTimeAgo(threeHoursAgo)).toBe('3h ago');

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000);
      expect(getTimeAgo(twoDaysAgo)).toBe('2d ago');
    });
  });

  describe('1-Click WhatsApp Concierge Outreach Generator', () => {
    it('generates luxury WhatsApp deep-link with standard 91 country code and personalized text', () => {
      const url = generateWhatsAppUrl(mockDeals[0]!);
      expect(url).toContain('https://wa.me/919109059791');
      expect(url).toContain(encodeURIComponent('Hello Dileep Bhargav'));
      expect(url).toContain(encodeURIComponent('4BHK Ultra-Luxury Penthouse'));
      expect(url).toContain(encodeURIComponent('Priya Sharma'));
    });

    it('handles phone numbers already containing 91 prefix without duplicating', () => {
      const dealWith91 = {
        clientName: 'Vikram',
        phone: '+91 9988776655',
      };
      const url = generateWhatsAppUrl(dealWith91);
      expect(url).toContain('https://wa.me/919988776655');
      expect(url).not.toContain('9191');
    });
  });

  describe('Quick Filter Bar & Triage Classification', () => {
    it("filters to Today's Inquiries (< 24h in NEW_INQUIRY)", () => {
      const todayDeals = filterDeals(mockDeals, 'today');
      expect(todayDeals.map((d) => d.id)).toEqual(['deal-1', 'deal-2']);
    });

    it('filters to Unassigned Leads requiring architect allocation', () => {
      const unassigned = filterDeals(mockDeals, 'unassigned');
      expect(unassigned).toHaveLength(1);
      expect(unassigned[0]?.id).toBe('deal-2');
    });

    it('filters to High-Value Luxury Inquiries (>= ₹15 Lakhs)', () => {
      const highValue = filterDeals(mockDeals, 'high_value');
      expect(highValue).toHaveLength(1);
      expect(highValue[0]?.id).toBe('deal-1');
      expect(highValue[0]?.estimatedDealValue).toBe(350000000);
    });

    it('performs live client search across patron name and phone number', () => {
      const searchByName = filterDeals(mockDeals, 'all', 'Dileep');
      expect(searchByName).toHaveLength(1);
      expect(searchByName[0]?.clientName).toBe('Dileep Bhargav');

      const searchByPhone = filterDeals(mockDeals, 'all', '881722');
      expect(searchByPhone).toHaveLength(1);
      expect(searchByPhone[0]?.clientName).toBe('Anjali Sharma');
    });
  });
});
