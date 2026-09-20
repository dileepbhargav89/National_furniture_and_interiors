import { describe, it, expect } from 'vitest';
import type { SiteInspectionReport, SitePhotoStreamItem, SnagChecklistItem } from '@nfi/api-client';

describe('Admin Site Stream & Quality Audit Suite', () => {
  const mockInspections: SiteInspectionReport[] = [
    {
      id: 'insp-1',
      inspectionDate: '2026-09-20T10:00:00.000Z',
      inspectorName: 'Vijay Kumar',
      inspectorRole: 'PROJECT_ENGINEER',
      currentPhase: 'CARPENTRY_CARCASES',
      workCompletedToday: 'Erected Century BWP 710 carcases for Master Wardrobe',
      manpowerCount: {
        carpenters: 6,
        polishers: 0,
        electricians: 2,
        helpers: 4,
      },
      materialDeliveriesVerified: ['Century BWP 710 Marine Ply (32 sheets)'],
      siteCleanlinessRating: 'EXCELLENT',
      photos: [],
      createdAt: '2026-09-20T10:30:00.000Z',
    },
    {
      id: 'insp-2',
      inspectionDate: '2026-09-21T10:00:00.000Z',
      inspectorName: 'Auditor Mehta',
      inspectorRole: 'QUALITY_AUDITOR',
      currentPhase: 'VENEER_PRESSING',
      workCompletedToday: 'Burma teak veneer pressing for Living Room paneling',
      manpowerCount: {
        carpenters: 4,
        polishers: 2,
        electricians: 1,
        helpers: 2,
      },
      materialDeliveriesVerified: ['Burma Teak Architectural Veneers (18 flitches)'],
      siteCleanlinessRating: 'GOOD',
      photos: [],
      createdAt: '2026-09-21T10:30:00.000Z',
    },
  ];

  const mockPhotos: SitePhotoStreamItem[] = [
    {
      id: 'ph-1',
      url: 'https://cdn.nationalinteriors.in/sites/jh-villa/carcase-01.webp',
      roomName: 'Master Bedroom',
      caption: 'Wardrobe carcase alignment completed with plumb-line verification.',
      workPhase: 'CARPENTRY_CARCASES',
      uploadedBy: 'Vijay Kumar',
      uploadedAt: '2026-09-20T11:00:00.000Z',
      isClientVisible: true,
      tags: ['century-ply', 'wardrobe'],
    },
    {
      id: 'ph-2',
      url: 'https://cdn.nationalinteriors.in/sites/jh-villa/wiring-audit.webp',
      roomName: 'Main Electrical Duct',
      caption: 'Concealed conduit line pressure test - internal QA record.',
      workPhase: 'ELECTRICAL_PLUMBING',
      uploadedBy: 'Auditor Mehta',
      uploadedAt: '2026-09-20T12:00:00.000Z',
      isClientVisible: false,
    },
    {
      id: 'ph-3',
      url: 'https://cdn.nationalinteriors.in/sites/jh-villa/veneer-fluting.webp',
      roomName: 'Formal Living Room',
      caption: 'Fluted solid Burma teak paneling alignment.',
      workPhase: 'VENEER_PRESSING',
      uploadedBy: 'Vijay Kumar',
      uploadedAt: '2026-09-21T14:00:00.000Z',
      isClientVisible: true,
    },
  ];

  const mockSnags: SnagChecklistItem[] = [
    {
      id: 'snag-1',
      title: 'Minor scratch on aluminum bottom runner track',
      roomName: 'Master Bedroom',
      description: 'Bottom track has 2mm surface scratch from delivery transit.',
      severity: 'COSMETIC',
      status: 'OPEN',
      reportedBy: 'Vijay Kumar',
      assignedTo: 'Lead Carpenter Ravi',
      reportedAt: '2026-09-20T11:30:00.000Z',
    },
    {
      id: 'snag-2',
      title: 'Veneer edge chip on Crockery Unit shutter',
      roomName: 'Dining Room',
      description: '0.5mm edge chip on left shutter bevel edge requires re-edging.',
      severity: 'CRITICAL',
      status: 'IN_PROGRESS',
      reportedBy: 'Auditor Mehta',
      assignedTo: 'Master Carpenter Harish',
      reportedAt: '2026-09-21T09:00:00.000Z',
    },
    {
      id: 'snag-3',
      title: 'Drawer soft-close damper tension weak',
      roomName: 'Kitchen Island',
      description: 'Rightmost cutlery drawer does not soft-close completely.',
      severity: 'MODERATE',
      status: 'RESOLVED',
      reportedBy: 'Site QA',
      assignedTo: 'Hardware Specialist Dinesh',
      reportedAt: '2026-09-19T14:00:00.000Z',
      resolvedAt: '2026-09-20T16:00:00.000Z',
      resolvedBy: 'Dinesh',
      resolutionNote: 'Adjusted damper spring screw and verified with 15kg load.',
    },
  ];

  it('correctly aggregates active on-site manpower count from daily inspection logs', () => {
    const latestInspection = mockInspections[0]!;
    const totalManpower =
      latestInspection.manpowerCount.carpenters +
      latestInspection.manpowerCount.polishers +
      latestInspection.manpowerCount.electricians +
      latestInspection.manpowerCount.helpers;

    expect(totalManpower).toBe(12);
    expect(latestInspection.manpowerCount.carpenters).toBe(6);
    expect(latestInspection.siteCleanlinessRating).toBe('EXCELLENT');
  });

  it('partitions site photos into patron portal visible feed vs internal QA audit', () => {
    const clientVisiblePhotos = mockPhotos.filter((p) => p.isClientVisible);
    const internalPhotos = mockPhotos.filter((p) => !p.isClientVisible);

    expect(clientVisiblePhotos).toHaveLength(2);
    expect(internalPhotos).toHaveLength(1);
    expect(internalPhotos[0]!.caption).toContain('internal QA record');
  });

  it('accurately counts open and critical defect snags for punch list zero-defect signoff', () => {
    const openSnags = mockSnags.filter((s) => s.status === 'OPEN' || s.status === 'IN_PROGRESS');
    const criticalOpenSnags = openSnags.filter((s) => s.severity === 'CRITICAL');
    const resolvedSnags = mockSnags.filter(
      (s) => s.status === 'RESOLVED' || s.status === 'CLIENT_VERIFIED',
    );

    expect(openSnags).toHaveLength(2);
    expect(criticalOpenSnags).toHaveLength(1);
    expect(criticalOpenSnags[0]!.title).toContain('Veneer edge chip');
    expect(resolvedSnags).toHaveLength(1);
    expect(resolvedSnags[0]!.resolvedBy).toBe('Dinesh');
  });
});
