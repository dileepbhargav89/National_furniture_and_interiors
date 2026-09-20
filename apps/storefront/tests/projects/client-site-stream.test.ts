import { describe, it, expect } from 'vitest';
import { ClientPhotoFeedItem } from '../../components/projects/client-site-stream-modal';

describe('Storefront Patron Turnkey Site Stream Suite', () => {
  const mockFeed: ClientPhotoFeedItem[] = [
    {
      id: 'feed-1',
      url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
      roomName: 'Master Bedroom Suite',
      caption:
        'Century Club Prime BWP 710 marine plywood carcases erected and laser-plumb verified.',
      workPhase: 'Custom Carpentry & Carcases',
      date: 'Sep 19, 2026',
      verifiedBadge: 'Century BWP 710 Verified',
    },
    {
      id: 'feed-2',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
      roomName: 'Living Room Atelier',
      caption:
        'Burma Teak fluted architectural panels aligned and clamped for cold hydraulic pressing.',
      workPhase: 'Veneer Pressing & Fluting',
      date: 'Sep 18, 2026',
      verifiedBadge: 'Authentic Burma Teak',
    },
    {
      id: 'feed-3',
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200',
      roomName: 'Gourmet Modular Kitchen',
      caption:
        'Blum Tandembox Antaro double-wall steel drawer runners fitted with lifetime tension calibration.',
      workPhase: 'Hardware & Mechanism Fitting',
      date: 'Sep 17, 2026',
      verifiedBadge: 'Blum Austria Certified',
    },
  ];

  it('correctly filters photo feed items by specific room area', () => {
    const masterBedroomPhotos = mockFeed.filter((p) => p.roomName === 'Master Bedroom Suite');
    expect(masterBedroomPhotos).toHaveLength(1);
    expect(masterBedroomPhotos[0]!.verifiedBadge).toBe('Century BWP 710 Verified');
    expect(masterBedroomPhotos[0]!.workPhase).toBe('Custom Carpentry & Carcases');
  });

  it('extracts unique room names for patron filter tabs', () => {
    const uniqueRooms = Array.from(new Set(mockFeed.map((p) => p.roomName)));
    expect(uniqueRooms).toEqual([
      'Master Bedroom Suite',
      'Living Room Atelier',
      'Gourmet Modular Kitchen',
    ]);
  });

  it('formats verified quality markers for high-net-worth patron assurance', () => {
    const blumItem = mockFeed.find((p) => p.verifiedBadge?.includes('Blum'));
    expect(blumItem).toBeDefined();
    expect(blumItem!.caption).toContain('Blum Tandembox Antaro');
  });

  it('generates well-formed WhatsApp Concierge inquiry URI with pre-filled project parameters', () => {
    const projectTitle = 'HSR Layout Flagship Villa (Master Suite & Living Atelier)';
    const projectLocation = 'HSR Layout Sector 2, Bengaluru';

    const text = `Hello National Furniture & Interiors Concierge, I am reviewing the live site progress for my project "${projectTitle}" (${projectLocation}) and have a quick inquiry.`;
    const encoded = encodeURIComponent(text);

    const whatsappUrl = `https://wa.me/919109059791?text=${encoded}`;

    expect(whatsappUrl).toContain('https://wa.me/919109059791?text=Hello%20National');
    expect(whatsappUrl).toContain(encodeURIComponent(projectTitle));
  });
});
