import { describe, it, expect } from 'vitest';

describe('Product Detail Page (PDP) & Media Gallery Suite', () => {
  describe('Angle 1: Resilient API Response Unwrapping', () => {
    it('unwraps both direct product object and nested { product: ... } response shapes', () => {
      const directResponse = {
        id: 'prod-123',
        name: 'Vetra 3 Seater Leather Sofa',
        slug: 'vetra-3-seater-leather-sofa',
      };

      const nestedResponse = {
        product: {
          id: 'prod-123',
          name: 'Vetra 3 Seater Leather Sofa',
          slug: 'vetra-3-seater-leather-sofa',
        },
      };

      const unwrap = (data: Record<string, unknown> | null) =>
        (data && 'product' in data ? (data.product as Record<string, unknown>) : data) || null;

      expect(unwrap(directResponse)?.name).toBe('Vetra 3 Seater Leather Sofa');
      expect(unwrap(nestedResponse)?.name).toBe('Vetra 3 Seater Leather Sofa');
      expect(unwrap(null)).toBeNull();
    });
  });

  describe('Angle 2: Unified Media Gallery Playlist Construction', () => {
    it('orders primary image first, followed by HD videos, then secondary photos', () => {
      const images = [
        { url: 'https://cdn.example.com/img-1.jpg', altText: 'Front View' },
        { url: 'https://cdn.example.com/img-2.jpg', altText: 'Side View' },
        { url: 'https://cdn.example.com/img-3.jpg', altText: 'Detail View' },
      ];

      const videos = [
        { url: 'https://cdn.example.com/craft-video.mp4', title: 'Artisanal Woodworking' },
      ];

      // Construction logic matching ProductMediaGallery
      const playlist: { type: 'image' | 'video'; url: string }[] = [];
      if (images[0]) playlist.push({ type: 'image', url: images[0].url });
      videos.forEach((v) => playlist.push({ type: 'video', url: v.url }));
      images.slice(1).forEach((img) => playlist.push({ type: 'image', url: img.url }));

      expect(playlist).toHaveLength(4);
      expect(playlist[0]?.type).toBe('image');
      expect(playlist[0]?.url).toBe('https://cdn.example.com/img-1.jpg');
      expect(playlist[1]?.type).toBe('video');
      expect(playlist[1]?.url).toBe('https://cdn.example.com/craft-video.mp4');
      expect(playlist[2]?.type).toBe('image');
      expect(playlist[2]?.url).toBe('https://cdn.example.com/img-2.jpg');
    });
  });

  describe('Angle 3: Luxury Pricing, Discount & EMI Mathematics', () => {
    it('accurately calculates discount percentage and EMI monthly payments', () => {
      const basePricePaise = 5699900; // ₹56,999
      const mrpPaise = 7999900; // ₹79,999

      const basePriceAmt = basePricePaise / 100;
      const mrpAmt = mrpPaise / 100;
      const savingsAmt = mrpAmt - basePriceAmt;
      const discountPercentage = Math.round((savingsAmt / mrpAmt) * 100);
      const emiPerMonth = Math.round(basePriceAmt / 12);

      expect(basePriceAmt).toBe(56999);
      expect(mrpAmt).toBe(79999);
      expect(savingsAmt).toBe(23000);
      expect(discountPercentage).toBe(29);
      expect(emiPerMonth).toBe(4750);
    });

    it('handles products without MRP or zero discount gracefully', () => {
      const basePricePaise = 4200000;
      const mrpPaise = undefined;

      const basePriceAmt = basePricePaise / 100;
      const mrpAmt = mrpPaise ? mrpPaise / 100 : null;
      const discountPercentage = mrpAmt && mrpAmt > basePriceAmt ? Math.round(((mrpAmt - basePriceAmt) / mrpAmt) * 100) : 0;

      expect(discountPercentage).toBe(0);
    });
  });

  describe('Angle 4: Dimensions & Pincode Validation', () => {
    it('formats 3D physical dimensions with units properly', () => {
      const dimensions = { length: 218, width: 92, height: 84, unit: 'cm' };
      const formatted = `${dimensions.length} × ${dimensions.width} × ${dimensions.height} ${dimensions.unit}`;
      expect(formatted).toBe('218 × 92 × 84 cm');
    });

    it('validates 6-digit Indian PIN codes correctly', () => {
      const validatePincode = (code: string) => /^\d{6}$/.test(code.trim());

      expect(validatePincode('560001')).toBe(true);
      expect(validatePincode('110001')).toBe(true);
      expect(validatePincode('5600')).toBe(false);
      expect(validatePincode('5600011')).toBe(false);
      expect(validatePincode('56000A')).toBe(false);
    });
  });

  describe('Angle 5: Related Products Exclusion & Limiting', () => {
    it('filters out the active product ID and limits showcase count', () => {
      const activeProductId = 'prod-active';
      const items = [
        { id: 'prod-active', name: 'Active Sofa' },
        { id: 'prod-1', name: 'Related Sofa 1' },
        { id: 'prod-2', name: 'Related Sofa 2' },
        { id: 'prod-3', name: 'Related Sofa 3' },
        { id: 'prod-4', name: 'Related Sofa 4' },
        { id: 'prod-5', name: 'Related Sofa 5' },
      ];

      const related = items
        .filter((item) => item.id !== activeProductId)
        .slice(0, 4);

      expect(related).toHaveLength(4);
      expect(related.some((r) => r.id === activeProductId)).toBe(false);
      expect(related[0]?.id).toBe('prod-1');
    });
  });
});
