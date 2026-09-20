import type { Server } from 'node:http';
import express, { type RequestHandler } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDesignProjectsRouter } from '../../src/modules/design-projects/presentation/design-projects.routes';
import { DesignProjectsController } from '../../src/modules/design-projects/presentation/design-projects.controller';
import {
  CreateDesignProjectUseCase,
  GetDesignProjectByIdUseCase,
  ListDesignProjectsUseCase,
  AdvanceProjectStageUseCase,
  AddQuotationUseCase,
  ApproveQuotationUseCase,
  GetDesignFunnelUseCase,
  RecordSiteInspectionUseCase,
  AddSitePhotoUseCase,
  LogSnagItemUseCase,
  UpdateSnagStatusUseCase,
} from '../../src/modules/design-projects/application/design-projects.use-cases';
import {
  IDesignProject,
  DesignProjectType,
  IDesignProjectRepository,
} from '../../src/modules/design-projects/domain/design-projects.types';
import { errorHandlerMiddleware } from '../../src/core/exceptions';

class InMemoryDesignProjectRepository implements IDesignProjectRepository {
  public projects: Map<string, IDesignProject> = new Map();
  private idCounter = 1;

  async create(
    project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>,
  ): Promise<IDesignProject> {
    const _id = `dp_site_${this.idCounter++}`;
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

    const updated = { ...project, ...updates, version: project.version + 1, updatedAt: new Date() };
    this.projects.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async getFunnelMetrics() {
    return {
      totalProjects: this.projects.size,
      inConsultation: 0,
      quotationSent: 0,
      inProgress: 1,
      completed: 0,
    };
  }
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());

  const repo = new InMemoryDesignProjectRepository();

  const controller = new DesignProjectsController({
    createDesignProject: new CreateDesignProjectUseCase(repo),
    getDesignProjectById: new GetDesignProjectByIdUseCase(repo),
    listDesignProjects: new ListDesignProjectsUseCase(repo),
    advanceProjectStage: new AdvanceProjectStageUseCase(repo),
    addQuotation: new AddQuotationUseCase(repo),
    approveQuotation: new ApproveQuotationUseCase(repo),
    getFunnelMetrics: new GetDesignFunnelUseCase(repo),
    recordSiteInspection: new RecordSiteInspectionUseCase(repo),
    addSitePhoto: new AddSitePhotoUseCase(repo),
    logSnagItem: new LogSnagItemUseCase(repo),
    updateSnagStatus: new UpdateSnagStatusUseCase(repo),
  });

  const testAuthMiddleware: RequestHandler = (req, _res, next) => {
    req.auth = {
      sub: 'usr_site_engineer_vijay',
      userType: 'STAFF',
      roleId: 'role-site-engineer',
      roleName: 'SITE_ENGINEER',
      permissions: ['design_projects.read', 'design_projects.write', '*'],
    };
    next();
  };

  const testRequirePermission = (): RequestHandler => (_req, _res, next) => {
    next();
  };

  const router = createDesignProjectsRouter(controller, testAuthMiddleware, testRequirePermission);
  app.use('/api/v1/design-projects', router);
  app.use(errorHandlerMiddleware);

  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind server port');
  }
  baseUrl = `http://127.0.0.1:${address.port}/api/v1/design-projects`;
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

describe('E2E Turnkey Site Inspection, Photo Stream & Snag HTTP Flow', () => {
  let createdProjectId = '';
  let currentVersion = 1;
  let loggedSnagId = '';

  it('1. Initializes an active turnkey design project in execution stage', async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectCode: 'DP-HYD-SITE-2026',
        customerId: 'usr_patron_site_1',
        projectType: DesignProjectType.RESIDENTIAL,
        propertyAddress: {
          street: 'Penthouse 18B, Jubilee Hills Heights',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'India',
        },
        propertyDetails: { areaSqft: 4500, rooms: 5, bhk: 4 },
        budgetRange: { min: 500000000, max: 1000000000 },
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data._id).toBeDefined();
    createdProjectId = json.data._id;
    currentVersion = json.data.version;
  });

  it('2. Records daily on-site inspection report via POST /:id/inspections', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        inspectionDate: '2026-09-20T10:30:00.000Z',
        inspectorName: 'Vijay Kumar',
        inspectorRole: 'PROJECT_ENGINEER',
        currentPhase: 'CARPENTRY_CARCASES',
        workCompletedToday:
          'Erected Century BWP 710 marine ply carcases for Master Wardrobe & Vanity.',
        manpowerCount: {
          carpenters: 6,
          polishers: 0,
          electricians: 2,
          helpers: 3,
        },
        materialDeliveriesVerified: [
          'Century BWP 710 Marine Plywood (40 sheets)',
          'Hettich Quadro 4D soft close drawer channels (12 sets)',
        ],
        siteCleanlinessRating: 'EXCELLENT',
        blockersOrDelays: 'None. Smooth progress.',
        photos: [
          {
            url: 'https://cdn.nationalinteriors.in/sites/banjara-penthouse/wardrobe-frame.webp',
            thumbnailUrl:
              'https://cdn.nationalinteriors.in/sites/banjara-penthouse/wardrobe-frame-thumb.webp',
            roomName: 'Master Bedroom',
            caption: 'Century BWP 710 carcase alignment verified with laser level.',
            workPhase: 'CARPENTRY_CARCASES',
            uploadedBy: 'Vijay Kumar',
            isClientVisible: true,
            tags: ['carcases', 'wardrobe', 'bwp-710'],
          },
        ],
        snags: [
          {
            title: 'Minor misalignment on dressing niche return',
            roomName: 'Master Bedroom',
            description: '1.5mm gap on right side return panel requires plane adjustment.',
            severity: 'COSMETIC',
            reportedBy: 'Vijay Kumar',
            assignedTo: 'Lead Carpenter Ravi',
          },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.siteInspections).toHaveLength(1);
    expect(json.data.sitePhotos).toHaveLength(1);
    expect(json.data.snagItems).toHaveLength(1);

    currentVersion = json.data.version;
    loggedSnagId = json.data.snagItems[0].id;
  });

  it('3. Fetches inspection history via GET /:id/inspections', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/inspections`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].inspectorName).toBe('Vijay Kumar');
    expect(json.data[0].currentPhase).toBe('CARPENTRY_CARCASES');
  });

  it('4. Adds an on-site photo via POST /:id/photos (Client Visible)', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        url: 'https://cdn.nationalinteriors.in/sites/banjara-penthouse/veneer-clamping.webp',
        roomName: 'Formal Living Room',
        caption: 'Natural Smoked Oak fluted panels set for cold pressing.',
        workPhase: 'VENEER_PRESSING',
        uploadedBy: 'Vijay Kumar',
        isClientVisible: true,
        tags: ['smoked-oak', 'living-room'],
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.sitePhotos).toHaveLength(2);
    currentVersion = json.data.version;
  });

  it('5. Adds internal-only trade photo via POST /:id/photos (isClientVisible = false)', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        url: 'https://cdn.nationalinteriors.in/sites/banjara-penthouse/conduit-pressure-test.webp',
        roomName: 'Main Electrical Duct',
        caption: 'Concealed conduit line pressure test - internal QA record.',
        workPhase: 'ELECTRICAL_PLUMBING',
        uploadedBy: 'Auditor Mehta',
        isClientVisible: false,
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.sitePhotos).toHaveLength(3);
    currentVersion = json.data.version;
  });

  it('6. Filters client-facing photos with GET /:id/photos?clientOnly=true', async () => {
    // All photos (admin view)
    const allRes = await fetch(`${baseUrl}/${createdProjectId}/photos`);
    expect(allRes.status).toBe(200);
    const allJson = await allRes.json();
    expect(allJson.data).toHaveLength(3);

    // Client-only stream (patron portal view)
    const clientRes = await fetch(`${baseUrl}/${createdProjectId}/photos?clientOnly=true`);
    expect(clientRes.status).toBe(200);
    const clientJson = await clientRes.json();
    expect(clientJson.data).toHaveLength(2);
    expect(
      clientJson.data.every((p: { isClientVisible?: boolean }) => p.isClientVisible === true),
    ).toBe(true);
  });

  it('7. Logs an urgent snag punch list item via POST /:id/snags', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/snags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        title: 'Waterproofing membrane primer curing inspection',
        roomName: 'Powder Toilet',
        description: 'Verify 2nd coat polyurethane waterproofing membrane cured before tiling.',
        severity: 'CRITICAL',
        reportedBy: 'K. Mehta (Lead QA)',
        assignedTo: 'Plumbing Specialist Ashok',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.snagItems).toHaveLength(2);
    currentVersion = json.data.version;
  });

  it('8. Resolves snag with resolution notes and after-photo via PATCH /:id/snags/:snagId', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/snags/${loggedSnagId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        status: 'RESOLVED',
        resolvedBy: 'Lead Carpenter Ravi',
        resolutionNote:
          'Adjusted dressing niche return panel with precision block plane. Verified 0mm flush joint.',
        afterPhotoUrl:
          'https://cdn.nationalinteriors.in/sites/banjara-penthouse/snag-resolved-dressing.webp',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const resolved = json.data.snagItems.find((s: { id: string }) => s.id === loggedSnagId);
    expect(resolved).toBeDefined();
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolvedBy).toBe('Lead Carpenter Ravi');
    expect(resolved.resolutionNote).toContain('0mm flush joint');
    expect(resolved.afterPhotoUrl).toBeDefined();
  });
});
