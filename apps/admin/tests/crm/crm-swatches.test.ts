import { describe, it, expect } from 'vitest';
import type { PipelineDeal, SwatchKitOrder } from '@nfi/api-client';

describe('Admin CRM Luxury Material Swatch Kit Ordering & Dispatch', () => {
  const sampleDeals: PipelineDeal[] = [
    {
      id: 'deal-swatch-1',
      customerId: 'cust-1',
      customerCode: 'NFI-C-301',
      clientName: 'Sanjay & Malini Singhania',
      email: 'sanjay@singhania.in',
      phone: '9845011223',
      community: 'Adarsh Palm Retreat, Bellandur',
      configuration: '4BHK Signature Villa (4,200 sq.ft)',
      estimatedDealValue: 280000000,
      weightedValue: 84000000,
      stage: 'QUALIFIED',
      probability: 30,
      clientTier: 'VIP_PLATINUM',
      priority: 'HOT',
      swatchKitOrder: {
        kitType: 'HARDWOOD_VENEERS',
        deliveryAddress: {
          line1: 'Villa 142, Palm Retreat, Outer Ring Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
        },
        depositAmount: 49900, // ₹499
        isDepositRefundable: true,
        dispatchStatus: 'ORDERED',
      },
      updatedAt: new Date().toISOString(),
      daysInStage: 1,
    },
    {
      id: 'deal-swatch-2',
      customerId: 'cust-2',
      customerCode: 'NFI-C-302',
      clientName: 'Deepa Narayanan',
      email: 'deepa.narayanan@wipro.com',
      phone: '9880099887',
      community: 'Prestige Silver Oak, Whitefield',
      configuration: '3BHK Modular Kitchen & Master Suite',
      estimatedDealValue: 165000000,
      weightedValue: 16500000,
      stage: 'NEW_INQUIRY',
      probability: 10,
      clientTier: 'HIGH_NET_WORTH',
      priority: 'HOT',
      swatchKitOrder: {
        kitType: 'MODULAR_KITCHEN',
        deliveryAddress: {
          line1: 'Flat 6B, Tower 2, Prestige Silver Oak',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560066',
        },
        depositAmount: 49900,
        isDepositRefundable: true,
        dispatchStatus: 'DISPATCHED',
        courierTrackingNumber: 'DTDC-BLR-48912',
      },
      updatedAt: new Date().toISOString(),
      daysInStage: 2,
    },
    {
      id: 'deal-regular-3',
      customerId: 'cust-3',
      customerCode: 'NFI-C-303',
      clientName: 'Vikram Joshi',
      email: 'vikram@joshi.org',
      phone: '9740055443',
      community: 'Sobha Windsor, Whitefield',
      configuration: '3BHK Living Room Furnishings',
      estimatedDealValue: 95000000,
      weightedValue: 28500000,
      stage: 'QUALIFIED',
      probability: 30,
      clientTier: 'HIGH_NET_WORTH',
      priority: 'WARM',
      updatedAt: new Date().toISOString(),
      daysInStage: 4,
    },
  ];

  describe('Swatch Kits Filtering & Identification', () => {
    it('correctly filters deals with active swatch kit orders', () => {
      const swatchesOnly = sampleDeals.filter(
        (d) => !!d.swatchKitOrder || (d.notes && d.notes.includes('Swatch Kit:')),
      );

      expect(swatchesOnly).toHaveLength(2);
      expect(swatchesOnly.map((d) => d.clientName)).toEqual([
        'Sanjay & Malini Singhania',
        'Deepa Narayanan',
      ]);
    });

    it('validates the ₹499 refundable advance token amount', () => {
      const swatchDeal = sampleDeals[0]!;
      expect(swatchDeal.swatchKitOrder?.depositAmount).toBe(49900); // 49,900 paise = ₹499
      expect(swatchDeal.swatchKitOrder?.isDepositRefundable).toBe(true);
    });
  });

  describe('Courier Dispatch Lifecycle', () => {
    it('supports advancing dispatch status from ORDERED to PACKED, DISPATCHED, and DELIVERED', () => {
      const deal = sampleDeals[0]!;
      const currentOrder = deal.swatchKitOrder!;

      const statuses: SwatchKitOrder['dispatchStatus'][] = [
        'ORDERED',
        'PACKED',
        'DISPATCHED',
        'DELIVERED',
      ];

      statuses.forEach((st) => {
        const updated: SwatchKitOrder = {
          ...currentOrder,
          dispatchStatus: st,
          ...(st === 'DISPATCHED' ? { courierTrackingNumber: 'BLR-BLUE-9901' } : {}),
        };
        expect(updated.dispatchStatus).toBe(st);
        if (st === 'DISPATCHED') {
          expect(updated.courierTrackingNumber).toBe('BLR-BLUE-9901');
        }
      });
    });
  });

  describe('WhatsApp Dispatch Message Generator', () => {
    function generateWhatsAppSwatchMessage(
      deal: PipelineDeal,
      repName = 'Design Consultant',
    ): string {
      const s = deal.swatchKitOrder!;
      const kitName = s.kitType.replace(/_/g, ' ');
      const trackingStr = s.courierTrackingNumber
        ? `\n📦 Courier Tracking AWB: ${s.courierTrackingNumber}`
        : '';
      return `Hello ${deal.clientName},\n\nYour National Furniture & Interiors Luxury Swatch Box has been prepared!\n\n📦 Collection: ${kitName}\n📍 Destination: ${s.deliveryAddress.line1}, ${s.deliveryAddress.city} - ${s.deliveryAddress.pincode}\n🚚 Status: ${s.dispatchStatus}${trackingStr}\n\nFeel free to touch and compare our authentic solid Burma teak, walnut veneers, and Italian upholstery fabrics under your home's natural lighting.\n\nOur Design Concierge, ${repName}, is available to answer any finishing queries.\n\nWarm regards,\nNational Furniture & Interiors Material Lab`;
    }

    it('generates a personalized WhatsApp courier update with destination and collection', () => {
      const deal = sampleDeals[1]!;
      const msg = generateWhatsAppSwatchMessage(deal, 'Priya Sharma');

      expect(msg).toContain('Hello Deepa Narayanan,');
      expect(msg).toContain('📦 Collection: MODULAR KITCHEN');
      expect(msg).toContain('Flat 6B, Tower 2, Prestige Silver Oak, Bengaluru - 560066');
      expect(msg).toContain('🚚 Status: DISPATCHED');
      expect(msg).toContain('📦 Courier Tracking AWB: DTDC-BLR-48912');
      expect(msg).toContain('Priya Sharma');
    });
  });
});
