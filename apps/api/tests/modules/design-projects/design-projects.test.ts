import { describe, it, expect, beforeEach } from 'vitest';
import { CreateDesignProjectUseCase, AdvanceProjectStageUseCase, AddQuotationUseCase, ApproveQuotationUseCase } from '../../../src/modules/design-projects/application/design-projects.use-cases';
import { IDesignProject, DesignProjectStage, DesignProjectType, IDesignProjectRepository } from '../../../src/modules/design-projects/domain/design-projects.types';

class MockDesignProjectRepository implements IDesignProjectRepository {
  public projects: Map<string, IDesignProject> = new Map();
  private idCounter = 1;

  async create(project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): Promise<IDesignProject> {
    const _id = String(this.idCounter++);
    const newProject: IDesignProject = {
      ...project,
      _id,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    };
    this.projects.set(_id, newProject);
    return JSON.parse(JSON.stringify(newProject));
  }

  async findById(id: string): Promise<IDesignProject | null> {
    const project = this.projects.get(id);
    return project ? JSON.parse(JSON.stringify(project)) : null;
  }

  async findByProjectCode(code: string): Promise<IDesignProject | null> {
    const project = Array.from(this.projects.values()).find(p => p.projectCode === code);
    return project ? JSON.parse(JSON.stringify(project)) : null;
  }

  async findAll(filters?: { stage?: DesignProjectStage; assignedDesignerId?: string }, limit: number = 10, skip: number = 0): Promise<{ items: IDesignProject[], total: number }> {
    let items = Array.from(this.projects.values());
    if (filters?.stage) {
      items = items.filter(i => i.stage === filters.stage);
    }
    if (filters?.assignedDesignerId) {
      items = items.filter(i => i.assignedDesignerId === filters.assignedDesignerId);
    }
    return { items: items.slice(skip, skip + limit).map(i => JSON.parse(JSON.stringify(i))), total: items.length };
  }

  async update(id: string, updates: Partial<IDesignProject>, expectedVersion?: number): Promise<IDesignProject | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    
    if (expectedVersion !== undefined && project.version !== expectedVersion) {
      throw new Error(`ConcurrencyError: Expected version ${expectedVersion} but found ${project.version}`);
    }

    const updated = { ...project, ...updates, version: project.version + 1, updatedAt: new Date() };
    this.projects.set(id, updated);
    return JSON.parse(JSON.stringify(updated));
  }
}

describe('Design Projects Use Cases', () => {
  let repository: MockDesignProjectRepository;

  beforeEach(() => {
    repository = new MockDesignProjectRepository();
  });

  describe('CreateDesignProjectUseCase', () => {
    it('should create a project in LEAD_CAPTURED stage', async () => {
      const useCase = new CreateDesignProjectUseCase(repository);
      const result = await useCase.execute({
        customerId: 'customer123',
        projectType: DesignProjectType.RESIDENTIAL,
        budgetRange: { min: 50000000, max: 100000000 },
        propertyAddress: { street: '123 Test St', city: 'Test City', state: 'TS', postalCode: '12345', country: 'IN' },
        propertyDetails: { areaSqft: 1500, rooms: 3, bhk: 3 },
        actorId: 'admin123'
      });

      expect(result.stage).toBe(DesignProjectStage.LEAD_CAPTURED);
      expect(result.customerId).toBe('customer123');
      expect(result.projectCode).toContain('DP-');
      expect(result.version).toBe(1);
      expect(result.stageHistory).toHaveLength(1);
    });
  });

  describe('AdvanceProjectStageUseCase', () => {
    it('should advance stage successfully following VALID_TRANSITIONS', async () => {
      const createUseCase = new CreateDesignProjectUseCase(repository);
      const advanceUseCase = new AdvanceProjectStageUseCase(repository);

      const project = await createUseCase.execute({
        customerId: 'cust1',
        projectType: DesignProjectType.COMMERCIAL,
        budgetRange: { min: 100000, max: 200000 },
        propertyAddress: { street: 'Main', city: 'City', state: 'ST', postalCode: '000', country: 'US' },
        propertyDetails: { areaSqft: 1000 },
        actorId: 'agent1'
      });

      const updated = await advanceUseCase.execute({
        projectId: project._id as string,
        targetStage: DesignProjectStage.QUALIFIED,
        expectedVersion: 1,
        actorId: 'agent1',
        note: 'Customer seems very interested'
      });

      expect(updated.stage).toBe(DesignProjectStage.QUALIFIED);
      expect(updated.version).toBe(2);
      expect(updated.stageHistory).toHaveLength(2);
      expect(updated.stageHistory[1].note).toBe('Customer seems very interested');
    });

    it('should reject invalid stage transitions', async () => {
      const createUseCase = new CreateDesignProjectUseCase(repository);
      const advanceUseCase = new AdvanceProjectStageUseCase(repository);

      const project = await createUseCase.execute({
        customerId: 'cust1',
        projectType: DesignProjectType.COMMERCIAL,
        budgetRange: { min: 100000, max: 200000 },
        propertyAddress: { street: 'Main', city: 'City', state: 'ST', postalCode: '000', country: 'US' },
        propertyDetails: { areaSqft: 1000 },
        actorId: 'agent1'
      });

      await expect(advanceUseCase.execute({
        projectId: project._id as string,
        targetStage: DesignProjectStage.APPROVED, // Invalid transition from LEAD_CAPTURED
        expectedVersion: 1,
        actorId: 'agent1'
      })).rejects.toThrow(/Cannot transition project/);
    });
  });

  describe('AddQuotationUseCase & ApproveQuotationUseCase', () => {
    it('should add a quotation', async () => {
      const createUseCase = new CreateDesignProjectUseCase(repository);
      const advanceUseCase = new AdvanceProjectStageUseCase(repository);
      const addQuotationUseCase = new AddQuotationUseCase(repository);

      // Create project
      let project = await createUseCase.execute({
        customerId: 'cust1',
        projectType: DesignProjectType.RESIDENTIAL,
        budgetRange: { min: 1, max: 100 },
        propertyAddress: { street: 'Main', city: 'City', state: 'ST', postalCode: '000', country: 'US' },
        propertyDetails: { areaSqft: 1000 },
        actorId: 'agent1'
      });

      // Move to PROPOSAL_IN_PROGRESS
      project = await advanceUseCase.execute({ projectId: project._id as string, targetStage: DesignProjectStage.QUALIFIED, expectedVersion: project.version, actorId: 'a1' });
      project = await advanceUseCase.execute({ projectId: project._id as string, targetStage: DesignProjectStage.CONSULTATION_SCHEDULED, expectedVersion: project.version, actorId: 'a1' });
      project = await advanceUseCase.execute({ projectId: project._id as string, targetStage: DesignProjectStage.SITE_VISIT_COMPLETED, expectedVersion: project.version, actorId: 'a1' });
      project = await advanceUseCase.execute({ projectId: project._id as string, targetStage: DesignProjectStage.PROPOSAL_IN_PROGRESS, expectedVersion: project.version, actorId: 'a1' });

      expect(project.stage).toBe(DesignProjectStage.PROPOSAL_IN_PROGRESS);

      // Add quotation
      project = await addQuotationUseCase.execute({
        projectId: project._id as string,
        boqItems: [
          { description: 'Item 1', quantity: 2, unitPrice: 100, total: 200 }
        ],
        expectedVersion: project.version,
        actorId: 'a1'
      });

      expect(project.quotations).toHaveLength(1);
      expect(project.quotations[0].version).toBe(1);
      expect(project.quotations[0].totalAmount).toBe(200);
      expect(project.stage).toBe(DesignProjectStage.PROPOSAL_IN_PROGRESS);
    });

    it('should approve quotation if in CLIENT_REVIEW', async () => {
      const approveQuotationUseCase = new ApproveQuotationUseCase(repository);

      // Setup a project in CLIENT_REVIEW with a quotation manually in repo
      const projectData: IDesignProject = {
        projectCode: 'TEST-1',
        customerId: 'cust1',
        projectType: DesignProjectType.RESIDENTIAL,
        stage: DesignProjectStage.CLIENT_REVIEW,
        budgetRange: { min: 1, max: 100 },
        propertyAddress: { street: 'Main', city: 'City', state: 'ST', postalCode: '000', country: 'US' },
        propertyDetails: { areaSqft: 1000 },
        quotations: [{ version: 1, boqItems: [], totalAmount: 0 }],
        milestones: [],
        stageHistory: [],
        version: 1,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const p = await repository.create(projectData);

      const approvedProject = await approveQuotationUseCase.execute({
        projectId: p._id as string,
        quotationVersion: 1,
        eSignatureRef: 'sig_12345',
        expectedVersion: 1,
        actorId: 'client1'
      });

      expect(approvedProject.quotations[0].approvedAt).toBeDefined();
      expect(approvedProject.quotations[0].eSignatureRef).toBe('sig_12345');
    });
  });
});
