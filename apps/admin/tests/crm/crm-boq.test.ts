import { describe, it, expect } from 'vitest';
import {
  QuotationItem,
  JOINERY_CORE_MATERIALS,
  JOINERY_FINISHES,
  HARDWARE_SYSTEM_OPTIONS,
  DEFAULT_ROOM_CATEGORIES,
} from '@nfi/api-client';

describe('Admin BOQ & Quotation Calculation Suite', () => {
  it('should accurately calculate square footage and unit rates for luxury materials', () => {
    const centuryBwp = JOINERY_CORE_MATERIALS.find((m) => m.id === 'CENTURY_BWP_710')!;
    const teakVeneer = JOINERY_FINISHES.find((f) => f.id === 'BURMA_TEAK_VENEER')!;
    const blumHardware = HARDWARE_SYSTEM_OPTIONS.find((h) => h.id === 'BLUM')!;

    expect(centuryBwp.ratePerSqftPaise).toBe(185000); // ₹1,850
    expect(teakVeneer.addonPerSqftPaise).toBe(65000); // ₹650
    expect(blumHardware.basePremiumPaise).toBe(1250000); // ₹12,500

    // Item: TV unit 12 ft x 8 ft = 96 sq.ft
    const width = 12;
    const height = 8;
    const areaSqft = width * height;
    expect(areaSqft).toBe(96);

    const ratePerSqftPaise = centuryBwp.ratePerSqftPaise + teakVeneer.addonPerSqftPaise;
    expect(ratePerSqftPaise).toBe(250000); // ₹2,500/sqft

    const baseJoineryPaise = areaSqft * ratePerSqftPaise; // 96 * 2,500 = ₹2,40,000
    expect(baseJoineryPaise).toBe(24000000);

    const totalItemPaise = baseJoineryPaise + blumHardware.basePremiumPaise; // ₹2,40,000 + ₹12,500 = ₹2,52,500
    expect(totalItemPaise).toBe(25250000);
  });

  it('should accurately calculate multi-stage breakdown, 10% design fee and 18% GST', () => {
    const items: QuotationItem[] = [
      {
        id: 'it-1',
        roomName: 'Living Room',
        description: 'Bespoke Media Console & Wall Paneling',
        dimensions: { widthFt: 10, heightFt: 8, areaSqft: 80 },
        ratePerUnit: 250000,
        quantity: 80,
        unitPrice: 250000,
        hardwareAddonPaise: 1250000, // Blum
        total: 21250000, // ₹2,12,500
      },
      {
        id: 'it-2',
        roomName: 'Master Bedroom Suite',
        description: 'Floor-to-Ceiling 4-Door Wardrobe in Century BWP',
        dimensions: { widthFt: 8, heightFt: 9, areaSqft: 72 },
        ratePerUnit: 260000,
        quantity: 72,
        unitPrice: 260000,
        hardwareAddonPaise: 850000, // Hettich
        total: 19570000, // ₹1,95,700
      },
    ];

    let baseJoinery = 0;
    let hardwareSum = 0;
    for (const item of items) {
      const hw = item.hardwareAddonPaise || 0;
      hardwareSum += hw;
      baseJoinery += item.total - hw;
    }

    expect(hardwareSum).toBe(2100000); // ₹21,000
    expect(baseJoinery).toBe(38720000); // ₹3,87,200

    const designFeePercent = 10;
    const designFeeAmount = Math.round(((baseJoinery + hardwareSum) * designFeePercent) / 100);
    expect(designFeeAmount).toBe(4082000); // 10% of ₹4,08,200 = ₹40,820

    const taxable = baseJoinery + hardwareSum + designFeeAmount;
    expect(taxable).toBe(44902000); // ₹4,49,020

    const gstAmount = Math.round(taxable * 0.18);
    expect(gstAmount).toBe(8082360); // 18% of ₹4,49,020 = ₹80,823.60

    const grandTotal = taxable + gstAmount;
    expect(grandTotal).toBe(52984360); // ₹5,29,843.60
  });

  it('should split 4-stage milestones (10/40/40/10) with exact sum reconciliation', () => {
    const grandTotalPaise = 52984360;

    const m1 = Math.round(grandTotalPaise * 0.1); // 10%
    const m2 = Math.round(grandTotalPaise * 0.4); // 40%
    const m3 = Math.round(grandTotalPaise * 0.4); // 40%
    const m4 = grandTotalPaise - m1 - m2 * 2; // remaining 10%

    expect(m1 + m2 + m3 + m4).toBe(grandTotalPaise);
    expect(m1).toBe(5298436); // ₹52,984.36
    expect(m2).toBe(21193744); // ₹2,11,937.44
    expect(m4).toBe(5298436);
  });

  it('should include all standard luxury room categories and materials', () => {
    expect(DEFAULT_ROOM_CATEGORIES).toContain('Living Room');
    expect(DEFAULT_ROOM_CATEGORIES).toContain('Gourmet Modular Kitchen');
    expect(DEFAULT_ROOM_CATEGORIES).toContain('Master Bedroom Suite');
    expect(DEFAULT_ROOM_CATEGORIES).toContain('Walk-in Wardrobe');

    const bwp = JOINERY_CORE_MATERIALS.find((m) => m.id === 'CENTURY_BWP_710');
    expect(bwp).toBeDefined();
    expect(bwp?.description).toContain('100% boiling-water-proof');

    const blum = HARDWARE_SYSTEM_OPTIONS.find((h) => h.id === 'BLUM');
    expect(blum).toBeDefined();
    expect(blum?.description).toContain('Aventos HF');
  });
});
