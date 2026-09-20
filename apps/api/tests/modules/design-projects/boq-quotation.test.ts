import { describe, it, expect, beforeEach } from 'vitest';
import { AddQuotationUseCase } from '../../../src/modules/design-projects/application/design-projects.use-cases';
import {
  IDesignProject,
  DesignProjectStage,
  DesignProjectType,
  IDesignProjectRepository,
  IQuotationItem,
  IQuotationFinancialBreakdown,
  IQuotationMilestoneScheduleItem,
} from '../../../src/modules/design-projects/domain/design-projects.types';
import { BoqPdfGeneratorAdapter } from '../../../src/modules/design-projects/infrastructure/adapters/boq-pdf.adapter';
import { addQuotationSchema } from '../../../src/modules/design-projects/presentation/design-projects.schemas';

class MockDesignProjectRepository implements IDesignProjectRepository {
  public projects: Map<string, IDesignProject> = new Map();

  async create(
    project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>,
  ): Promise<IDesignProject> {
    const _id = 'dp-mock-1';
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
      totalProjects: 1,
      inConsultation: 0,
      quotationSent: 1,
      inProgress: 0,
      completed: 0,
    };
  }
}

describe('BOQ & Quotation PDF Builder Suite', () => {
  let repository: MockDesignProjectRepository;
  let addQuotationUseCase: AddQuotationUseCase;
  let testProject: IDesignProject;

  const mockBoqItems: IQuotationItem[] = [
    {
      id: 'item_1',
      roomName: 'Living Room',
      category: 'TV_CONSOLE',
      description: 'Floating Burma Teak Veneer Media Console with Fluted Wall Paneling',
      dimensions: { widthFt: 10, heightFt: 8, areaSqft: 80 },
      coreMaterial: 'CENTURY_BWP_710',
      finish: 'BURMA_TEAK_VENEER',
      hardwareBrand: 'BLUM',
      hardwareDetails: 'Blum Tip-On Push-to-Open mechanisms',
      ratePerUnit: 250000, // ₹2,500/sqft in paise
      quantity: 80,
      unitPrice: 250000,
      total: 20000000, // ₹2,00,000 in paise
    },
    {
      id: 'item_2',
      roomName: 'Master Bedroom Suite',
      category: 'WARDROBE',
      description: 'Floor-to-Ceiling 4-Door Wardrobe with Sayerlack PU Matte Polish',
      dimensions: { widthFt: 8, heightFt: 9, areaSqft: 72 },
      coreMaterial: 'CENTURY_BWP_710',
      finish: 'PU_LACQUER',
      hardwareBrand: 'HETTICH',
      hardwareDetails: 'Hettich Sensys 110° Soft-Close Hinges',
      ratePerUnit: 220000, // ₹2,200/sqft in paise
      quantity: 72,
      unitPrice: 220000,
      total: 15840000, // ₹1,58,400 in paise
    },
  ];

  const mockFinancialBreakdown: IQuotationFinancialBreakdown = {
    baseJoineryAmount: 35840000, // ₹3,58,400
    hardwareAmount: 2100000, // ₹21,000
    finishingPolishAmount: 1500000, // ₹15,000
    designFeePercent: 10,
    designFeeAmount: 3944000, // 10% of (358400 + 21000 + 15000)
    gstRate: 18,
    gstAmount: 7809120, // 18% of ₹4,33,840
    grandTotal: 51193120, // ₹5,11,931.20 in paise
  };

  const mockMilestones: IQuotationMilestoneScheduleItem[] = [
    {
      stageName: 'Advance Booking Token',
      percentage: 10,
      amount: 5119312,
      dueTrigger: 'On 3D Floor Plan Signoff',
    },
    {
      stageName: 'Factory Procurement & Carcases',
      percentage: 40,
      amount: 20477248,
      dueTrigger: 'Before Material Cutting',
    },
    {
      stageName: 'On-Site Joinery Erection',
      percentage: 40,
      amount: 20477248,
      dueTrigger: 'Upon Delivery at Site',
    },
    {
      stageName: 'Final Handover & Snag Signoff',
      percentage: 10,
      amount: 5119312,
      dueTrigger: 'Handover & 10-Yr Warranty',
    },
  ];

  beforeEach(async () => {
    repository = new MockDesignProjectRepository();
    addQuotationUseCase = new AddQuotationUseCase(repository);

    testProject = await repository.create({
      projectCode: 'DP-BLR-2026-001',
      customerId: 'usr_cust_1',
      projectType: DesignProjectType.RESIDENTIAL,
      stage: DesignProjectStage.PROPOSAL_IN_PROGRESS,
      budgetRange: { min: 200000000, max: 600000000 },
      propertyAddress: {
        street: 'Penthouse 4B, Prestige Kingfisher Towers, Lavelle Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      propertyDetails: { areaSqft: 2800, rooms: 4, bhk: 4 },
      quotations: [],
      milestones: [],
      stageHistory: [
        {
          stage: DesignProjectStage.LEAD_CAPTURED,
          changedAt: new Date(),
          changedBy: 'system',
        },
        {
          stage: DesignProjectStage.PROPOSAL_IN_PROGRESS,
          changedAt: new Date(),
          changedBy: 'system',
        },
      ],
    });
  });

  it('should successfully add a detailed BOQ quotation with version increment', async () => {
    const updated = await addQuotationUseCase.execute({
      projectId: testProject._id!,
      boqItems: mockBoqItems,
      financialBreakdown: mockFinancialBreakdown,
      milestoneSchedule: mockMilestones,
      expectedVersion: testProject.version,
      actorId: 'usr_arch_1',
    });

    expect(updated.stage).toBe(DesignProjectStage.PROPOSAL_IN_PROGRESS);
    expect(updated.quotations).toHaveLength(1);
    const q = updated.quotations[0]!;
    expect(q.version).toBe(1);
    expect(q.totalAmount).toBe(mockFinancialBreakdown.grandTotal);
    expect(q.boqItems).toHaveLength(2);
    expect(q.boqItems[0]!.roomName).toBe('Living Room');
    expect(q.boqItems[0]!.hardwareBrand).toBe('BLUM');
    expect(q.financialBreakdown?.gstRate).toBe(18);
    expect(q.pdfUrl).toBe(`/api/v1/design-projects/${testProject._id}/quotations/1/pdf`);
  });

  it('should generate a valid luxury PDF buffer with %PDF- magic bytes using BoqPdfGeneratorAdapter', async () => {
    const updated = await addQuotationUseCase.execute({
      projectId: testProject._id!,
      boqItems: mockBoqItems,
      financialBreakdown: mockFinancialBreakdown,
      milestoneSchedule: mockMilestones,
      expectedVersion: testProject.version,
      actorId: 'usr_arch_1',
    });

    const quotation = updated.quotations[0]!;
    const pdfAdapter = new BoqPdfGeneratorAdapter();
    const pdfBuffer = await pdfAdapter.generateBuffer(updated, quotation);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1500);

    const magicBytes = pdfBuffer.subarray(0, 5).toString('ascii');
    expect(magicBytes).toBe('%PDF-');
  });

  it('should validate addQuotationSchema correctly with full luxury BOQ payload', () => {
    const validPayload = {
      params: { id: 'dp-mock-1' },
      body: {
        expectedVersion: 1,
        boqItems: mockBoqItems,
        financialBreakdown: mockFinancialBreakdown,
        milestoneSchedule: mockMilestones,
      },
    };

    const parsed = addQuotationSchema.parse(validPayload);
    expect(parsed.body.expectedVersion).toBe(1);
    expect(parsed.body.boqItems).toHaveLength(2);
    expect(parsed.body.financialBreakdown?.grandTotal).toBe(51193120);
    expect(parsed.body.milestoneSchedule).toHaveLength(4);
  });
});
