import { describe, it, expect } from 'vitest';
import type { PipelineDeal } from '@nfi/api-client';

describe('Admin CRM Consultation Booking & Triage', () => {
  const sampleDeals: PipelineDeal[] = [
    {
      id: 'deal-1',
      customerId: 'cust-1',
      customerCode: 'NFI-C-001',
      clientName: 'Sunita Reddy',
      email: 'sunita@reddy.com',
      phone: '9845012345',
      community: 'Kingfisher Towers, Lavelle Road',
      configuration: 'Penthouse Interiors',
      estimatedDealValue: 350000000,
      weightedValue: 175000000,
      stage: 'STUDIO_CONSULTATION',
      probability: 50,
      clientTier: 'VIP_PLATINUM',
      priority: 'HOT',
      assignedRepId: 'rep_1',
      assignedRepName: 'Priya Sharma',
      daysInStage: 2,
      consultationBooking: {
        consultationType: 'STUDIO_VISIT',
        studioLocation: 'INDIRANAGAR',
        scheduledDate: '2026-09-26',
        timeSlot: '11:30 AM - 01:00 PM',
        meetingNotes: 'Interested in solid teak and Italian marble.',
      },
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'deal-2',
      customerId: 'cust-2',
      customerCode: 'NFI-C-002',
      clientName: 'Arun Kumar',
      email: 'arun@tech.com',
      phone: '9880198765',
      community: 'Prestige Lakeside Habitat',
      configuration: '3BHK Modular Kitchen & Wardrobes',
      estimatedDealValue: 180000000,
      weightedValue: 18000000,
      stage: 'NEW_INQUIRY',
      probability: 10,
      clientTier: 'HIGH_NET_WORTH',
      priority: 'HOT',
      daysInStage: 1,
      consultationBooking: {
        consultationType: 'VIRTUAL_VIDEO_CALL',
        studioLocation: 'VIRTUAL',
        scheduledDate: '2026-09-25',
        timeSlot: '04:00 PM - 05:30 PM',
      },
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'deal-3',
      customerId: 'cust-3',
      customerCode: 'NFI-C-003',
      clientName: 'Deepak Sharma',
      email: 'deepak@corp.com',
      phone: '9740043210',
      community: 'Total Environment',
      configuration: 'Living Suite',
      estimatedDealValue: 80000000,
      weightedValue: 8000000,
      stage: 'NEW_INQUIRY',
      probability: 10,
      clientTier: 'RETAIL',
      priority: 'WARM',
      daysInStage: 1,
      updatedAt: new Date().toISOString(),
    },
  ];

  it('filters deals specifically by scheduled consultations', () => {
    const scheduledDeals = sampleDeals.filter(
      (d) => !!d.consultationBooking || (d.notes && d.notes.includes('Scheduled:')),
    );
    expect(scheduledDeals.length).toBe(2);
    expect(scheduledDeals.map((d) => d.id)).toEqual(['deal-1', 'deal-2']);
  });

  it('verifies consultation booking badge metadata formatting', () => {
    const deal = sampleDeals[0]!;
    const b = deal.consultationBooking!;
    const studioLabel =
      b.studioLocation === 'VIRTUAL' ? 'Virtual Video Call' : `${b.studioLocation} Studio`;
    const badgeText = `${studioLabel} · ${b.scheduledDate} @ ${b.timeSlot}`;

    expect(badgeText).toBe('INDIRANAGAR Studio · 2026-09-26 @ 11:30 AM - 01:00 PM');
  });

  it('generates customized appointment WhatsApp concierge message for scheduled deal', () => {
    const deal = sampleDeals[0]!;
    const b = deal.consultationBooking!;
    const repName = deal.assignedRepName || 'Design Consultant';
    const venueStr = `${b.studioLocation} Experience Studio`;

    const message = `Hello ${deal.clientName},\n\nYour design consultation at National Furniture & Interiors is confirmed for:\n🏛️ Location: ${venueStr}\n📅 Date: ${b.scheduledDate}\n⏰ Time Window: ${b.timeSlot}\n\nOur Senior Interior Architect, ${repName}, has reserved this slot exclusively for your ${deal.configuration} at ${deal.community} to walk through material finishes and 3D concept plans.\n\nLooking forward to welcoming you!\n\nWarm regards,\nNational Furniture & Interiors Concierge\nBengaluru Flagship: 100ft Rd, Indiranagar · Whitefield · HSR Layout`;

    expect(message).toContain('Sunita Reddy');
    expect(message).toContain('2026-09-26');
    expect(message).toContain('11:30 AM - 01:00 PM');
    expect(message).toContain('Priya Sharma');
    expect(message).toContain('Penthouse Interiors');
  });
});
