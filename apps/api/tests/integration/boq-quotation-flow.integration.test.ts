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
} from '../../src/modules/design-projects/application/design-projects.use-cases';
import {
  IDesignProject,
  DesignProjectStage,
  DesignProjectType,
  IDesignProjectRepository,
  IQuotationItem,
  IQuotationFinancialBreakdown,
  IQuotationMilestoneScheduleItem,
} from '../../src/modules/design-projects/domain/design-projects.types';
import { errorHandlerMiddleware } from '../../src/core/exceptions';

class InMemoryDesignProjectRepository implements IDesignProjectRepository {
  public projects: Map<string, IDesignProject> = new Map();
  private idCounter = 1;

  async create(
    project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>,
  ): Promise<IDesignProject> {
    const _id = `dp_e2e_${this.idCounter++}`;
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
      quotationSent: 1,
      inProgress: 0,
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
  });

  const testAuthMiddleware: RequestHandler = (req, _res, next) => {
    req.auth = {
      sub: 'usr_architect_e2e',
      userType: 'STAFF',
      roleId: 'role-architect',
      roleName: 'ARCHITECT',
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

describe('E2E BOQ Quotation & PDF Generation HTTP Lifecycle Suite', () => {
  let createdProjectId = '';
  let currentVersion = 1;

  const mockBoqItems: IQuotationItem[] = [
    {
      id: 'it_liv_1',
      roomName: 'Living Room',
      category: 'TV_CONSOLE',
      description: 'Century BWP 710 Media Console with Burma Teak Veneer and Blum Aventos',
      dimensions: { widthFt: 12, heightFt: 8, areaSqft: 96 },
      coreMaterial: 'CENTURY_BWP_710',
      finish: 'BURMA_TEAK_VENEER',
      hardwareBrand: 'BLUM',
      hardwareDetails: 'Blum Tip-On Push & Aventos Lift Mechanisms',
      ratePerUnit: 250000,
      quantity: 96,
      unitPrice: 250000,
      total: 24000000,
    },
    {
      id: 'it_kit_1',
      roomName: 'Gourmet Modular Kitchen',
      category: 'MODULAR_KITCHEN',
      description: 'European Anti-Fingerprint Acrylic Shutters with Hettich InnoTech Drawers',
      dimensions: { widthFt: 15, heightFt: 7, areaSqft: 105 },
      coreMaterial: 'CENTURY_BWP_710',
      finish: 'EUROPEAN_ACRYLIC',
      hardwareBrand: 'HETTICH',
      hardwareDetails: 'Hettich Sensys 110 Soft-Close & InnoTech Atira Drawers',
      ratePerUnit: 260000,
      quantity: 105,
      unitPrice: 260000,
      total: 27300000,
    },
  ];

  const mockFinancialBreakdown: IQuotationFinancialBreakdown = {
    baseJoineryAmount: 51300000, // ₹5,13,000
    hardwareAmount: 2500000, // ₹25,000
    finishingPolishAmount: 1800000,
    designFeePercent: 10,
    designFeeAmount: 5560000, // ₹55,600
    gstRate: 18,
    gstAmount: 11008800, // 18% GST = ₹1,10,088
    grandTotal: 72168800, // ₹7,21,688 in paise
  };

  const mockMilestones: IQuotationMilestoneScheduleItem[] = [
    {
      stageName: 'Advance Token Signoff',
      percentage: 10,
      amount: 7216880,
      dueTrigger: 'On 3D Floor Plan Signoff',
    },
    {
      stageName: 'Factory Carcase Production',
      percentage: 40,
      amount: 28867520,
      dueTrigger: 'Before Material Cutting',
    },
    {
      stageName: 'Site Joinery Erection',
      percentage: 40,
      amount: 28867520,
      dueTrigger: 'Upon Material Dispatch to Site',
    },
    {
      stageName: 'Final Handover & Snag Signoff',
      percentage: 10,
      amount: 7216880,
      dueTrigger: 'Handover & 10-Yr Warranty',
    },
  ];

  it('Step 1: Successfully creates a new Design Project via POST /api/v1/design-projects', async () => {
    const res = await fetch(`${baseUrl}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectCode: 'DP-BLR-E2E-2026',
        customerId: 'usr_patron_e2e_1',
        projectType: DesignProjectType.RESIDENTIAL,
        propertyAddress: {
          street: 'Penthouse 12A, Kingfisher Towers, Ashok Nagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        propertyDetails: { areaSqft: 3400, rooms: 4, bhk: 4 },
        budgetRange: { min: 400000000, max: 900000000 },
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.projectCode).toMatch(/^DP-/);
    expect(body.data.stage).toBe(DesignProjectStage.LEAD_CAPTURED);
    createdProjectId = body.data._id;
    currentVersion = body.data.version;
    expect(createdProjectId).toBeTruthy();
  });

  it('Step 2: Progresses stages sequentially: LEAD_CAPTURED -> QUALIFIED -> CONSULTATION -> SITE_VISIT -> PROPOSAL_IN_PROGRESS', async () => {
    // 1. LEAD_CAPTURED -> QUALIFIED
    let res = await fetch(`${baseUrl}/${createdProjectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStage: DesignProjectStage.QUALIFIED,
        expectedVersion: currentVersion,
      }),
    });
    expect(res.status).toBe(200);
    let body = await res.json();
    expect(body.data.stage).toBe(DesignProjectStage.QUALIFIED);
    currentVersion = body.data.version;

    // 2. QUALIFIED -> CONSULTATION_SCHEDULED
    res = await fetch(`${baseUrl}/${createdProjectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStage: DesignProjectStage.CONSULTATION_SCHEDULED,
        expectedVersion: currentVersion,
      }),
    });
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.data.stage).toBe(DesignProjectStage.CONSULTATION_SCHEDULED);
    currentVersion = body.data.version;

    // 3. CONSULTATION_SCHEDULED -> SITE_VISIT_COMPLETED
    res = await fetch(`${baseUrl}/${createdProjectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStage: DesignProjectStage.SITE_VISIT_COMPLETED,
        expectedVersion: currentVersion,
      }),
    });
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.data.stage).toBe(DesignProjectStage.SITE_VISIT_COMPLETED);
    currentVersion = body.data.version;

    // 4. SITE_VISIT_COMPLETED -> PROPOSAL_IN_PROGRESS
    res = await fetch(`${baseUrl}/${createdProjectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStage: DesignProjectStage.PROPOSAL_IN_PROGRESS,
        expectedVersion: currentVersion,
      }),
    });
    expect(res.status).toBe(200);
    body = await res.json();
    expect(body.data.stage).toBe(DesignProjectStage.PROPOSAL_IN_PROGRESS);
    currentVersion = body.data.version;
  });

  it('Step 3: Adds a multi-room luxury BOQ quotation via POST /api/v1/design-projects/:id/quotations', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expectedVersion: currentVersion,
        boqItems: mockBoqItems,
        financialBreakdown: mockFinancialBreakdown,
        milestoneSchedule: mockMilestones,
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.quotations).toHaveLength(1);

    const q = body.data.quotations[0];
    expect(q.version).toBe(1);
    expect(q.totalAmount).toBe(72168800);
    expect(q.boqItems).toHaveLength(2);
    expect(q.boqItems[0].coreMaterial).toBe('CENTURY_BWP_710');
    expect(q.boqItems[0].hardwareBrand).toBe('BLUM');
    expect(q.boqItems[1].hardwareBrand).toBe('HETTICH');
    expect(q.pdfUrl).toBe(`/api/v1/design-projects/${createdProjectId}/quotations/1/pdf`);
    currentVersion = body.data.version;
  });

  it('Step 4: Fetches project details via GET /api/v1/design-projects/:id verifying persistent BOQ', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}`);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.quotations).toHaveLength(1);
    expect(body.data.quotations[0].financialBreakdown.grandTotal).toBe(72168800);
    expect(body.data.quotations[0].milestoneSchedule).toHaveLength(4);
  });

  it('Step 5: Downloads the official PDF document via GET /api/v1/design-projects/:id/quotations/:qid/pdf', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/quotations/1/pdf`);
    expect(res.status).toBe(200);

    expect(res.headers.get('content-type')).toContain('application/pdf');
    const disposition = res.headers.get('content-disposition');
    expect(disposition).toContain('inline; filename=');
    expect(disposition).toContain('.pdf');

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    expect(buffer.length).toBeGreaterThan(1500);

    // Verify PDF Magic Bytes %PDF-
    const magic = buffer.subarray(0, 5).toString('ascii');
    expect(magic).toBe('%PDF-');
  });

  it('Step 6: Advances project stage to QUOTATION_SENT via PATCH /api/v1/design-projects/:id/stage', async () => {
    const res = await fetch(`${baseUrl}/${createdProjectId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetStage: DesignProjectStage.QUOTATION_SENT,
        expectedVersion: currentVersion,
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.stage).toBe(DesignProjectStage.QUOTATION_SENT);
  });
});
