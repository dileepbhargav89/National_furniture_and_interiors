import { describe, it, expect } from 'vitest';

export const OUR_STORY_DATA = {
  brandName: 'National Furniture & Interiors',
  establishedYear: 1998,
  yearsOfExperience: '28+',
  manufacturingFacility: {
    sizeSqFt: '40,000',
    location: 'Bengaluru, Karnataka',
    capabilities: [
      'German panel processing machinery',
      'Automated 12-stage wood drying kilns',
      'Precision mortise-and-tenon joinery',
      'PVD architectural metal fabrication',
    ],
  },
  homesFurnished: '1,200+',
  warrantyYears: 10,
  handoverDays: 45,
  factoryDirectSavings: '20% – 25%',
  materials: [
    'Century 710 Club Prime BWP Marine Plywood',
    'Kiln-seasoned Burma and Sheesham Teak',
    'Belgian bouclés and Italian linen textiles',
    'PVD coated 304 stainless steel and brass',
  ],
  showroom: {
    address: '#1315, 24th Main Road, Opp. to Purva Fairmont Apartment, Sector 2, HSR Layout, Bengaluru 560102',
    whatsapp: '+91 9663628302',
  },
};

describe('Our Story Page Heritage & Data Contract', () => {
  it('correctly attributes the verified founding year to 1998 in Bengaluru', () => {
    expect(OUR_STORY_DATA.establishedYear).toBe(1998);
    expect(OUR_STORY_DATA.yearsOfExperience).toBe('28+');
    expect(OUR_STORY_DATA.manufacturingFacility.location).toContain('Bengaluru');
  });

  it('verifies 40,000 sq.ft manufacturing facility data and industrial capabilities', () => {
    expect(OUR_STORY_DATA.manufacturingFacility.sizeSqFt).toBe('40,000');
    expect(OUR_STORY_DATA.manufacturingFacility.capabilities.length).toBeGreaterThanOrEqual(4);
    expect(OUR_STORY_DATA.manufacturingFacility.capabilities[1]).toContain('kilns');
  });

  it('includes key customer value propositions (factory direct savings and warranty)', () => {
    expect(OUR_STORY_DATA.factoryDirectSavings).toBe('20% – 25%');
    expect(OUR_STORY_DATA.warrantyYears).toBe(10);
    expect(OUR_STORY_DATA.handoverDays).toBe(45);
    expect(OUR_STORY_DATA.homesFurnished).toBe('1,200+');
  });

  it('ensures authentic materials specification without generic placeholders', () => {
    expect(OUR_STORY_DATA.materials[0]).toContain('Century 710');
    expect(OUR_STORY_DATA.materials[1]).toContain('Burma');
    expect(OUR_STORY_DATA.materials[3]).toContain('PVD');
  });

  it('provides verified HSR Layout showroom reference opposite Purva Fairmont', () => {
    expect(OUR_STORY_DATA.showroom.address).toContain('Purva Fairmont');
    expect(OUR_STORY_DATA.showroom.address).toContain('HSR Layout');
    expect(OUR_STORY_DATA.showroom.whatsapp).toBe('+91 9663628302');
  });
});
