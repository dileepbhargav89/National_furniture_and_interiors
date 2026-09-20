import { describe, it, expect, beforeEach } from 'vitest';
import {
  RecordSiteInspectionUseCase,
  AddSitePhotoUseCase,
  LogSnagItemUseCase,
  UpdateSnagStatusUseCase,
} from '../../../src/modules/design-projects/application/design-projects.use-cases';
import {
  IDesignProject,
  DesignProjectStage,
  DesignProjectType,
  IDesignProjectRepository,
} from '../../../src/modules/design-projects/domain/design-projects.types';
import { ConcurrencyError } from '../../../src/core/exceptions';

class MockDesignProjectRepository implements IDesignProjectRepository {
  public projects: Map<string, IDesignProject> = new Map();

  async create(
    project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>,
  ): Promise<IDesignProject> {
    const _id = 'dp-site-mock-1';
    const newProject: IDesignProject = {
      ...project,
      _id,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    };
    this.projects.set(_id, newProject);
    return JSON.parse(JSON.stringify(newProject));
  }

  async findById(id: string): Promise<IDesignProject | null> {
    const project = this.projects.get(id);
    return project ? JSON.parse(JSON.stringify(project)) : null;
  }

  async findByProjectCode(code: string): Promise<IDesignProject | null> {
    const project = Array.from(this.projects.values()).find((p) => p.projectCode === code);
    return project ? JSON.parse(JSON.stringify(project)) : null;
  }

  async findAll(): Promise<{ items: IDesignProject[]; total: number }> {
    const items = Array.from(this.projects.values());
    return { items, total: items.length };
  }

  async update(
    id: string,
    updates: Partial<IDesignProject>,
    expectedVersion?: number,
  ): Promise<IDesignProject | null> {
    const project = this.projects.get(id);
    if (!project) return null;

    if (expectedVersion !== undefined && project.version !== expectedVersion) {
      throw new Error(
        `ConcurrencyError: Expected version ${expectedVersion} but found ${project.version}`,
      );
    }

    const updated = {
      ...project,
      ...updates,
      version: project.version + 1,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async getFunnelMetrics() {
    return {
      totalProjects: 1,
      inConsultation: 0,
      quotationSent: 0,
      inProgress: 1,
      completed: 0,
    };
  }
}

describe('Turnkey Site Inspection & On-Site Mobile Photo Stream Suite', () => {
  let repository: MockDesignProjectRepository;
  let recordInspectionUseCase: RecordSiteInspectionUseCase;
  let addSitePhotoUseCase: AddSitePhotoUseCase;
  let logSnagItemUseCase: LogSnagItemUseCase;
  let updateSnagStatusUseCase: UpdateSnagStatusUseCase;
  let testProject: IDesignProject;

  beforeEach(async () => {
    repository = new MockDesignProjectRepository();
    recordInspectionUseCase = new RecordSiteInspectionUseCase(repository);
    addSitePhotoUseCase = new AddSitePhotoUseCase(repository);
    logSnagItemUseCase = new LogSnagItemUseCase(repository);
    updateSnagStatusUseCase = new UpdateSnagStatusUseCase(repository);

    testProject = await repository.create({
      projectCode: 'NFI-SITE-2026-001',
      title: 'Bespoke Jubilee Hills Villa Interior',
      client: {
        name: 'Siddharth Rao',
        email: 'siddharth@example.com',
        phone: '+91 98765 43210',
        city: 'Hyderabad',
      },
      assignedDesignerId: 'designer_raghav_1',
      stage: DesignProjectStage.EXECUTION_IN_PROGRESS,
      type: DesignProjectType.FULL_RESIDENCE,
      stageHistory: [],
      quotations: [],
      milestones: [],
      siteInspections: [],
      sitePhotos: [],
      snagItems: [],
    });
  });

  describe('Daily Site Inspection Logging', () => {
    it('records daily site inspection report with manpower count, verified materials, and phase', async () => {
      const updated = await recordInspectionUseCase.execute({
        projectId: testProject._id,
        expectedVersion: 1,
        actorId: 'site_eng_vijay',
        inspectionDate: '2026-09-20T10:00:00.000Z',
        inspectorName: 'Vijay Kumar',
        inspectorRole: 'PROJECT_ENGINEER',
        currentPhase: 'CARPENTRY_CARCASES',
        workCompletedToday:
          'Erected Century BWP 710 marine plywood carcases for Master Bedroom Walk-in Wardrobe.',
        manpowerCount: {
          carpenters: 6,
          polishers: 0,
          electricians: 2,
          helpers: 4,
        },
        materialDeliveriesVerified: [
          'Century BWP 710 Marine Ply (32 sheets)',
          'Blum Tandembox Plus soft-close runners (14 sets)',
        ],
        siteCleanlinessRating: 'EXCELLENT',
        blockersOrDelays: 'None. Power backup active.',
        photos: [
          {
            url: 'https://cdn.nationalinteriors.in/sites/jh-villa/carcase-01.webp',
            thumbnailUrl: 'https://cdn.nationalinteriors.in/sites/jh-villa/carcase-01-thumb.webp',
            roomName: 'Master Bedroom',
            caption: 'Wardrobe carcase alignment completed with plumb-line verification.',
            workPhase: 'CARPENTRY_CARCASES',
            uploadedBy: 'Vijay Kumar',
            isClientVisible: true,
            tags: ['century-ply', 'wardrobe', 'carcases'],
          },
        ],
        snags: [
          {
            title: 'Minor scratch on aluminum bottom runner track',
            roomName: 'Master Bedroom',
            description: 'Bottom track has 2mm surface scratch from delivery transit.',
            severity: 'COSMETIC',
            reportedBy: 'Vijay Kumar',
            assignedTo: 'Lead Carpenter Ravi',
          },
        ],
      });

      expect(updated.version).toBe(2);
      expect(updated.siteInspections).toBeDefined();
      expect(updated.siteInspections).toHaveLength(1);

      const inspection = updated.siteInspections![0];
      expect(inspection.inspectorName).toBe('Vijay Kumar');
      expect(inspection.currentPhase).toBe('CARPENTRY_CARCASES');
      expect(inspection.manpowerCount.carpenters).toBe(6);
      expect(inspection.materialDeliveriesVerified).toContain(
        'Century BWP 710 Marine Ply (32 sheets)',
      );

      // Photos aggregated to project level
      expect(updated.sitePhotos).toHaveLength(1);
      expect(updated.sitePhotos![0].roomName).toBe('Master Bedroom');
      expect(updated.sitePhotos![0].isClientVisible).toBe(true);

      // Snags aggregated to project level
      expect(updated.snagItems).toHaveLength(1);
      expect(updated.snagItems![0].severity).toBe('COSMETIC');
      expect(updated.snagItems![0].status).toBe('OPEN');
    });

    it('rejects update with ConcurrencyError when expectedVersion does not match', async () => {
      await expect(
        recordInspectionUseCase.execute({
          projectId: testProject._id,
          expectedVersion: 999, // stale version
          actorId: 'site_eng_vijay',
          inspectionDate: '2026-09-20T10:00:00.000Z',
          inspectorName: 'Vijay Kumar',
          inspectorRole: 'PROJECT_ENGINEER',
          currentPhase: 'CARPENTRY_CARCASES',
          workCompletedToday: 'Stale test',
          manpowerCount: { carpenters: 1, polishers: 0, electricians: 0, helpers: 0 },
        }),
      ).rejects.toThrow(ConcurrencyError);
    });
  });

  describe('Live Mobile Photo Stream', () => {
    it('allows site engineers to upload on-site photos with client visibility flag', async () => {
      const updated = await addSitePhotoUseCase.execute({
        projectId: testProject._id,
        expectedVersion: 1,
        actorId: 'site_eng_vijay',
        url: 'https://cdn.nationalinteriors.in/sites/jh-villa/veneer-pressing.webp',
        thumbnailUrl: 'https://cdn.nationalinteriors.in/sites/jh-villa/veneer-pressing-thumb.webp',
        roomName: 'Living Room Formal Foyer',
        caption: 'Burma Teak fluted veneer panels aligned and clamped for curing.',
        workPhase: 'VENEER_PRESSING',
        uploadedBy: 'Vijay Kumar',
        isClientVisible: true,
        tags: ['burma-teak', 'foyer', 'luxury-joinery'],
      });

      expect(updated.version).toBe(2);
      expect(updated.sitePhotos).toHaveLength(1);
      const photo = updated.sitePhotos![0];
      expect(photo.roomName).toBe('Living Room Formal Foyer');
      expect(photo.workPhase).toBe('VENEER_PRESSING');
      expect(photo.isClientVisible).toBe(true);
      expect(photo.id).toMatch(/^photo_/);
    });

    it('allows internal-only photo uploads that remain hidden from client feed', async () => {
      const updated = await addSitePhotoUseCase.execute({
        projectId: testProject._id,
        expectedVersion: 1,
        actorId: 'quality_auditor_mehta',
        url: 'https://cdn.nationalinteriors.in/sites/jh-villa/concealed-wiring-audit.webp',
        roomName: 'Electrical DB Area',
        caption: 'Internal inspection of conduit line depth before plastering.',
        workPhase: 'ELECTRICAL_PLUMBING',
        uploadedBy: 'Quality Auditor Mehta',
        isClientVisible: false,
        tags: ['internal-audit', 'wiring'],
      });

      expect(updated.sitePhotos![0].isClientVisible).toBe(false);
    });
  });

  describe('Snag Punch List Lifecycle', () => {
    it('logs new snags with severity, room name, and contractor assignment', async () => {
      const updated = await logSnagItemUseCase.execute({
        projectId: testProject._id,
        expectedVersion: 1,
        actorId: 'quality_auditor_mehta',
        title: 'Veneer edge chip on Crockery Unit shutter',
        roomName: 'Dining Room',
        description:
          '0.5mm edge chip on left shutter bevel edge requires re-edging with 2mm solid teak lip.',
        severity: 'CRITICAL',
        reportedBy: 'K. Mehta (Lead QA)',
        assignedTo: 'Master Carpenter Harish',
        beforePhotoUrl: 'https://cdn.nationalinteriors.in/sites/jh-villa/snag-veneer-chip.webp',
      });

      expect(updated.snagItems).toHaveLength(1);
      const snag = updated.snagItems![0];
      expect(snag.title).toBe('Veneer edge chip on Crockery Unit shutter');
      expect(snag.severity).toBe('CRITICAL');
      expect(snag.status).toBe('OPEN');
      expect(snag.reportedBy).toBe('K. Mehta (Lead QA)');
      expect(snag.assignedTo).toBe('Master Carpenter Harish');
    });

    it('transitions snag from OPEN to RESOLVED with resolution notes and after-photo', async () => {
      // Step 1: Log snag
      const projectWithSnag = await logSnagItemUseCase.execute({
        projectId: testProject._id,
        expectedVersion: 1,
        actorId: 'qa_auditor',
        title: 'Drawer soft-close damper tension weak',
        roomName: 'Kitchen Island',
        description: 'Rightmost cutlery drawer does not soft-close completely.',
        severity: 'MODERATE',
        reportedBy: 'Site QA',
        assignedTo: 'Hardware Specialist Dinesh',
      });

      const snagId = projectWithSnag.snagItems![0].id;
      expect(snagId).toBeDefined();

      // Step 2: Resolve snag
      const resolvedProject = await updateSnagStatusUseCase.execute({
        projectId: testProject._id,
        snagId,
        expectedVersion: projectWithSnag.version,
        actorId: 'hardware_lead_dinesh',
        status: 'RESOLVED',
        resolvedBy: 'Dinesh (Blum Certified Technician)',
        resolutionNote:
          'Adjusted spring damper tension screw and re-calibrated Blum tip-on mechanism. Verified with 15kg load test.',
        afterPhotoUrl: 'https://cdn.nationalinteriors.in/sites/jh-villa/snag-resolved-drawer.webp',
      });

      expect(resolvedProject.version).toBe(3);
      const resolvedSnag = resolvedProject.snagItems!.find((s) => s.id === snagId);
      expect(resolvedSnag).toBeDefined();
      expect(resolvedSnag!.status).toBe('RESOLVED');
      expect(resolvedSnag!.resolvedBy).toBe('Dinesh (Blum Certified Technician)');
      expect(resolvedSnag!.resolutionNote).toContain('15kg load test');
      expect(resolvedSnag!.resolvedAt).toBeDefined();
    });
  });
});
