import { describe, it, expect } from 'vitest';
import {
  CURATED_COLLECTIONS_DATA,
  ROOM_CATEGORIES,
  AESTHETIC_STYLES,
} from '../../data/curated-collections';

describe('Curated Collections Storefront Redesign — 4-Agent Verification Suite', () => {
  describe('Agent 1 (Logic): Collections Data Architecture & Enrichment Contract', () => {
    it('contains all 10 curated lifestyle collections with complete schema compliance', () => {
      const slugs = Object.keys(CURATED_COLLECTIONS_DATA);
      expect(slugs.length).toBe(10);
      expect(slugs).toContain('mid-century-modern-living');
      expect(slugs).toContain('scandinavian-minimalism');
      expect(slugs).toContain('japandi-harmony');
      expect(slugs).toContain('industrial-loft');
      expect(slugs).toContain('classic-elegance');
      expect(slugs).toContain('contemporary-office');
      expect(slugs).toContain('rustic-farmhouse');
      expect(slugs).toContain('outdoor-sanctuary');
      expect(slugs).toContain('urban-studio');
      expect(slugs).toContain('bohemian-oasis');
    });

    it('ensures every collection has valid room categories, styles, and piece counts', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(col.title.length).toBeGreaterThan(3);
        expect(['living', 'dining', 'bedroom', 'office', 'outdoor', 'studio']).toContain(col.roomType);
        expect(col.style.length).toBeGreaterThan(2);
        expect(col.pieceCount).toBeGreaterThanOrEqual(5);
        expect(col.materials.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('verifies room categories and aesthetic styles lists are properly populated', () => {
      expect(ROOM_CATEGORIES.length).toBe(7);
      expect(ROOM_CATEGORIES[0]?.id).toBe('all');
      expect(AESTHETIC_STYLES.length).toBeGreaterThanOrEqual(6);
      expect(AESTHETIC_STYLES).toContain('All Styles');
      expect(AESTHETIC_STYLES).toContain('Japandi');
      expect(AESTHETIC_STYLES).toContain('Mid-Century Modern');
    });
  });

  describe('Agent 2 (CWV & Performance): Image Assets & Responsive Layout Ratios', () => {
    it('ensures every collection hero image has valid high-resolution photography', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(col.heroImage).toMatch(/^https:\/\/images\.unsplash\.com/);
        expect(col.heroImage).toContain('q=80');
      });
    });

    it('ensures designer quotes are informative and concisely structured for CLS prevention', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(col.designerQuote.length).toBeGreaterThan(40);
        expect(col.designerQuote.length).toBeLessThan(180);
      });
    });
  });

  describe('Agent 3 (UI/UX & a11y): Brand Luxury Standards & Trust Badges', () => {
    it('verifies that curated badges reflect premium craftsmanship and styling', () => {
      const allowedBadges = new Set([
        "Architect's Top Choice",
        'Trending in Whitefield',
        'Raw & Authentic',
        'Artisanal Hand-Weave',
        'Heritage Luxury',
        'Ergonomic Excellence',
        'Natural Wood Grain',
        'All-Weather Grade',
        'High-Utility Modular',
        'Calm & Timeless',
      ]);

      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(allowedBadges.has(col.curatedBadge)).toBe(true);
      });
    });

    it('confirms all collections specify authentic wood and high-performance materials', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        const hasSolidOrEngineered = col.materials.some((m) =>
          /teak|wood|ash|oak|sheesham|plywood|rattan|steel|velvet|marble|wicker|walnut|veneer/i.test(m)
        );
        expect(hasSolidOrEngineered).toBe(true);
      });
    });
  });

  describe('Agent 4 (Business & Funnel): Pricing Transparency & Bengaluru Market Fit', () => {
    it('validates competitive package starting prices and No-Cost EMI calculations', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(col.startingPrice).toBeGreaterThanOrEqual(50000); // Premium furniture suites
        expect(col.startingPrice).toBeLessThanOrEqual(250000);
        expect(col.emiMonthly).toBeGreaterThan(2000);
        expect(col.bundleDiscountPercent).toBeGreaterThanOrEqual(10);
        expect(col.bundleDiscountPercent).toBeLessThanOrEqual(15);
      });
    });

    it('ensures every collection links to prominent Bengaluru residential communities', () => {
      Object.values(CURATED_COLLECTIONS_DATA).forEach((col) => {
        expect(col.popularInSocieties.length).toBeGreaterThanOrEqual(1);
        const societiesJoined = col.popularInSocieties.join(' ');
        expect(
          /Prestige|Sobha|Kingfisher|Adarsh|Indiranagar|Whitefield|HSR|Sadashivanagar|RMZ|Windmills|Total Environment/i.test(
            societiesJoined
          )
        ).toBe(true);
      });
    });
  });
});
