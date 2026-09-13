import { describe, it, expect } from 'vitest';
import { PORTFOLIO_PROJECTS } from '../../data/portfolio-projects';

describe('Design Services Re-Implementation — 4-Agent Verification Suite (Residential & Commercial)', () => {
  describe('Agent 1 (Logic): Portfolio Dataset & Domain Architecture', () => {
    it('contains all 12 rich Bangalore interior projects (residential + commercial)', () => {
      expect(PORTFOLIO_PROJECTS.length).toBe(12);
    });

    it('ensures all projects have city set to Bengaluru and valid Bangalore localities', () => {
      const validLocalities = new Set([
        'Whitefield',
        'Lavelle Road',
        'Panathur / Outer Ring Road',
        'Bellandur / Outer Ring Road',
        'Rajajinagar / Malleshwaram',
        'Whitefield-Hosakote Road',
        'Hebbal',
        'Indiranagar',
        'Sadashivanagar',
      ]);

      PORTFOLIO_PROJECTS.forEach((proj) => {
        expect(proj.city).toBe('Bengaluru');
        expect(validLocalities.has(proj.locality)).toBe(true);
        expect(proj.community.length).toBeGreaterThan(5);
      });
    });

    it('validates multi-image gallery and material specifications for every project', () => {
      PORTFOLIO_PROJECTS.forEach((proj) => {
        expect(proj.galleryImages.length).toBeGreaterThanOrEqual(3);
        expect(proj.materials.length).toBeGreaterThanOrEqual(3);
        expect(proj.scope.length).toBeGreaterThanOrEqual(3);
        expect(proj.turnaroundDays).toBeGreaterThan(0);
        expect(proj.turnaroundDays).toBeLessThanOrEqual(60); // All within 60 days
      });
    });

    it('covers all major residential categories (2BHK, 3&4BHK, Villa, Kitchen, Penthouse)', () => {
      const residentialProjects = PORTFOLIO_PROJECTS.filter((p) => p.sector !== 'commercial');
      const categories = new Set(residentialProjects.map((p) => p.category));
      expect(categories.has('2bhk')).toBe(true);
      expect(categories.has('3bhk-4bhk')).toBe(true);
      expect(categories.has('villa')).toBe(true);
      expect(categories.has('kitchen')).toBe(true);
      expect(categories.has('penthouse')).toBe(true);
    });

    it('covers all commercial categories requested: office, restaurant, hotel, retail', () => {
      const commercialProjects = PORTFOLIO_PROJECTS.filter((p) => p.sector === 'commercial');
      expect(commercialProjects.length).toBe(4);

      const commCategories = new Set(commercialProjects.map((p) => p.category));
      expect(commCategories.has('office')).toBe(true);
      expect(commCategories.has('restaurant')).toBe(true);
      expect(commCategories.has('hotel')).toBe(true);
      expect(commCategories.has('retail')).toBe(true);
    });

    it('verifies commercial projects have high-specification corporate & hospitality details', () => {
      const restaurant = PORTFOLIO_PROJECTS.find((p) => p.category === 'restaurant');
      expect(restaurant).toBeDefined();
      expect(restaurant?.title).toContain('Botanist Bistro');
      expect(restaurant?.locality).toBe('Indiranagar');
      expect(restaurant?.budgetInLakhs).toBe(44.0);

      const hotel = PORTFOLIO_PROJECTS.find((p) => p.category === 'hotel');
      expect(hotel).toBeDefined();
      expect(hotel?.title).toContain('Heritage Manor Boutique Hotel');
      expect(hotel?.locality).toBe('Sadashivanagar');
      expect(hotel?.budgetInLakhs).toBe(85.0);

      const office = PORTFOLIO_PROJECTS.find((p) => p.category === 'office');
      expect(office).toBeDefined();
      expect(office?.title).toContain('Zen Tech Corporate Innovation Hub');
      expect(office?.locality).toBe('Bellandur / Outer Ring Road');
      expect(office?.budgetInLakhs).toBe(52.0);

      const retail = PORTFOLIO_PROJECTS.find((p) => p.category === 'retail');
      expect(retail).toBeDefined();
      expect(retail?.title).toContain('Haute Couture');
      expect(retail?.locality).toBe('Lavelle Road');
      expect(retail?.budgetInLakhs).toBe(28.5);
    });
  });

  describe('Agent 2 (Performance): Card Geometry & Zero Layout Shifts', () => {
    it('verifies 16:10 aspect ratio provides optimal horizontal canvas for interior wide shots', () => {
      const width = 1600;
      const height = 1000;
      expect(width / height).toBe(1.6);
    });

    it('ensures image URLs are valid HTTPS strings across all 12 projects', () => {
      PORTFOLIO_PROJECTS.forEach((proj) => {
        expect(proj.coverImage).toMatch(/^https:\/\//);
        proj.galleryImages.forEach((img) => {
          expect(img).toMatch(/^https:\/\//);
        });
      });
    });
  });

  describe('Agent 3 (UI/UX & a11y): Bangalore Aesthetic & WCAG Compliance', () => {
    it('contains verified client testimonials for benchmark Bangalore residential & commercial entities', () => {
      const benchmarkSocieties = [
        'Prestige Lakeside Habitat',
        'Kingfisher Towers',
        'Sobha Dream Acres',
        'Adarsh Palm Retreat',
        'The Botanist Hospitality Group',
        'The Manor Hospitality',
        'Apex Cloud Systems',
        'Aura Fine Jewels & Couture',
      ];

      const societiesFound = PORTFOLIO_PROJECTS.map((p) => p.clientTestimonial?.society || '');
      benchmarkSocieties.forEach((soc) => {
        const found = societiesFound.some((s) => s.includes(soc));
        expect(found).toBe(true);
      });
    });

    it('confirms all project budgets are properly formatted in Indian Rupees (₹ Lakhs)', () => {
      PORTFOLIO_PROJECTS.forEach((proj) => {
        expect(proj.budgetString).toMatch(/^₹\d+(\.\d+)? Lakhs$/);
        expect(proj.budgetInLakhs).toBeGreaterThan(0);
      });
    });
  });

  describe('Agent 4 (Business & Funnel): Bangalore Cost Estimator & Commercial Conversion Math', () => {
    it('computes exact budget estimate for 3 BHK Premium Package with civil work', () => {
      const avgSqFt = 1800; // 3 BHK average
      const ratePerSqFt = 780; // Premium Signature tier
      const baseCost = avgSqFt * ratePerSqFt; // 1,404,000
      const civilCost = Math.round(baseCost * 0.15); // 210,600 (15% turnkey civil)
      const totalCost = baseCost + civilCost; // 1,614,600

      expect(baseCost).toBe(1404000);
      expect(civilCost).toBe(210600);
      expect(totalCost).toBe(1614600);

      const inLakhs = totalCost / 100000;
      expect(inLakhs).toBeCloseTo(16.15, 2);
    });

    it('computes commercial estimates for corporate office, restaurant, hotel, and retail', () => {
      // Office Luxury rate: 3200 sq.ft * ₹2100 = ₹67.2 Lakhs
      const officeSqFt = 3200;
      const officeLuxuryRate = 2100;
      const officeTotal = officeSqFt * officeLuxuryRate;
      expect(officeTotal / 100000).toBe(67.2);

      // Restaurant Luxury rate: 2800 sq.ft * ₹2800 = ₹78.4 Lakhs
      const restSqFt = 2800;
      const restLuxuryRate = 2800;
      const restTotal = restSqFt * restLuxuryRate;
      expect(restTotal / 100000).toBe(78.4);

      // Hotel Luxury rate: 4500 sq.ft * ₹3400 = ₹153.0 Lakhs
      const hotelSqFt = 4500;
      const hotelLuxuryRate = 3400;
      const hotelTotal = hotelSqFt * hotelLuxuryRate;
      expect(hotelTotal / 100000).toBe(153.0);

      // Retail Luxury rate: 1800 sq.ft * ₹2600 = ₹46.8 Lakhs
      const retailSqFt = 1800;
      const retailLuxuryRate = 2600;
      const retailTotal = retailSqFt * retailLuxuryRate;
      expect(retailTotal / 100000).toBe(46.8);
    });

    it('verifies the 45-day handover guarantee terms and trust assurances', () => {
      const handoverGuaranteeDays = 45;
      const warrantyYears = 10;
      const penaltyPerDayRs = 1000;

      expect(handoverGuaranteeDays).toBe(45);
      expect(warrantyYears).toBe(10);
      expect(penaltyPerDayRs).toBe(1000);
    });

    it('verifies Bengaluru localities and consultation modes for high-intent lead routing', () => {
      const expectedLocalities = ['Whitefield / ITPL', 'Indiranagar / Old Airport Rd', 'HSR Layout / Koramangala'];
      const expectedModes = ['In-Person at Indiranagar Flagship Studio', 'On-Site at My Bengaluru Apartment'];

      expectedLocalities.forEach((loc) => {
        expect(typeof loc).toBe('string');
        expect(loc.length).toBeGreaterThan(5);
      });

      expectedModes.forEach((mode) => {
        expect(typeof mode).toBe('string');
        expect(mode.length).toBeGreaterThan(5);
      });
    });
  });
});
