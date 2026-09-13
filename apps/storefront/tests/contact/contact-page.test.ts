import { describe, it, expect } from 'vitest';

export const NATIONAL_INTERIORS_CONTACT_DATA = {
  businessName: 'National Furniture & Interiors',
  alternateBusinessName: 'National Furniture and Interior Design',
  address: {
    doorNumber: '#1315',
    street: '24th Main Road',
    landmark: 'Opposite to Purva Fairmont Apartment',
    sector: 'Sector 2, BDA Layout',
    locality: 'HSR Layout',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560102',
  },
  phones: {
    primary: '+91 9663628302',
    alternate: '+91 98457 00349',
    whatsapp: '919663628302',
  },
  email: 'nationalfurniture07@gmail.com',
  hours: {
    days: 'Monday – Sunday',
    timing: '10:00 AM – 9:30 PM',
    isOpenSevenDays: true,
  },
  customerAttractionMetrics: {
    rating: 4.8,
    homesFurnished: '1,200+',
    establishedYear: 1998,
    experienceYears: '28+',
    warrantyYears: 10,
    factoryDirectSavings: '20% – 25%',
    manufacturingFacilitySqFt: '40,000',
  },
  mapEmbedQuery: 'National Furniture & Interiors - Furniture store in HSR Layout',
};

describe('National Furniture & Interiors Contact Page Data Contract', () => {
  it('contains accurate HSR Layout address and landmark opposite Purva Fairmont', () => {
    expect(NATIONAL_INTERIORS_CONTACT_DATA.address.doorNumber).toBe('#1315');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.address.street).toBe('24th Main Road');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.address.landmark).toContain('Purva Fairmont');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.address.locality).toBe('HSR Layout');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.address.pincode).toBe('560102');
  });

  it('provides verified primary and alternate phone numbers', () => {
    expect(NATIONAL_INTERIORS_CONTACT_DATA.phones.primary).toBe('+91 9663628302');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.phones.alternate).toBe('+91 98457 00349');
    expect(NATIONAL_INTERIORS_CONTACT_DATA.email).toBe('nationalfurniture07@gmail.com');
  });

  it('provides valid WhatsApp direct communication integration link', () => {
    const rawNumber = NATIONAL_INTERIORS_CONTACT_DATA.phones.whatsapp;
    expect(rawNumber).toMatch(/^91\d{10}$/);
    const link = `https://wa.me/${rawNumber}?text=Hello`;
    expect(link).toContain('https://wa.me/919663628302');
  });

  it('includes verified customer attraction and trust metrics', () => {
    const metrics = NATIONAL_INTERIORS_CONTACT_DATA.customerAttractionMetrics;
    expect(metrics.rating).toBeGreaterThanOrEqual(4.8);
    expect(metrics.establishedYear).toBe(1998);
    expect(metrics.warrantyYears).toBe(10);
    expect(metrics.manufacturingFacilitySqFt).toBe('40,000');
  });

  it('specifies 7-day visiting hours for Bengaluru showroom buyers', () => {
    expect(NATIONAL_INTERIORS_CONTACT_DATA.hours.isOpenSevenDays).toBe(true);
    expect(NATIONAL_INTERIORS_CONTACT_DATA.hours.timing).toBe('10:00 AM – 9:30 PM');
  });

  it('includes valid Google Maps query for HSR Layout location', () => {
    expect(NATIONAL_INTERIORS_CONTACT_DATA.mapEmbedQuery).toContain('HSR Layout');
  });
});
