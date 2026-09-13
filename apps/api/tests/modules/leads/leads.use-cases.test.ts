import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  SubmitLeadUseCase, 
  SubmitLeadRequest,
  AssignLeadUseCase,
  UpdateLeadStatusUseCase
} from '../../../src/modules/leads/application/leads.use-cases';
import { ILeadRepository } from '../../../src/modules/leads/application/ports';
import { ValidationError, ConflictError } from '../../../src/core/exceptions';
import { Lead } from '../../../src/modules/leads/domain/leads.types';
import { DomainEventType } from '../../../src/core/events/domain-events';

describe('Leads Use Cases', () => {
  let mockLeadRepo: vitest.Mocked<ILeadRepository>;
  let mockOutboxRepo: vitest.Mocked<any>;
  
  const sampleLead: Lead = {
    id: 'lead_1',
    source: 'WEBSITE_FORM',
    name: 'John Doe',
    phone: '1234567890',
    interestType: 'INTERIOR_DESIGN',
    marketingConsent: { granted: true, channels: ['EMAIL'] },
    score: 50,
    priority: 'WARM',
    status: 'NEW',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    version: 0
  };

  beforeEach(() => {
    mockLeadRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      update: vi.fn(),
    } as any;
    mockOutboxRepo = {
      append: vi.fn(),
    } as any;
  });

  describe('SubmitLeadUseCase', () => {
    it('should successfully submit a valid lead and score it', async () => {
      const useCase = new SubmitLeadUseCase(mockLeadRepo, mockOutboxRepo);
      mockLeadRepo.create.mockResolvedValue(sampleLead);

      const request: SubmitLeadRequest = {
        source: 'WEBSITE_FORM',
        name: 'Jane Doe',
        phone: '0987654321',
        interestType: 'BOTH',
        budgetRange: { min: 100, max: 200 },
        marketingConsent: { granted: true, channels: ['SMS', 'EMAIL'] },
        captchaToken: 'valid-token'
      };

      const result = await useCase.execute(request);

      expect(mockLeadRepo.create).toHaveBeenCalled();
      const callArgs = mockLeadRepo.create.mock.calls[0][0];
      
      // BOTH (70) + BudgetRange (30) = 100 -> HOT priority
      expect(callArgs.score).toBe(100);
      expect(callArgs.priority).toBe('HOT');
      expect(result).toEqual(sampleLead);
      expect(mockOutboxRepo.append).toHaveBeenCalledWith({
        eventType: DomainEventType.LEAD_CREATED,
        aggregateType: 'Lead',
        aggregateId: sampleLead.id,
        payload: sampleLead,
      });
    });

    it('should throw ValidationError if CAPTCHA is invalid', async () => {
      const useCase = new SubmitLeadUseCase(mockLeadRepo, mockOutboxRepo);
      
      const request: SubmitLeadRequest = {
        source: 'WEBSITE_FORM',
        name: 'Jane Doe',
        phone: '0987654321',
        interestType: 'BOTH',
        marketingConsent: { granted: true, channels: ['SMS'] },
        captchaToken: 'invalid'
      };

      await expect(useCase.execute(request)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if marketing consent is granted but no channels specified', async () => {
      const useCase = new SubmitLeadUseCase(mockLeadRepo, mockOutboxRepo);
      
      const request: SubmitLeadRequest = {
        source: 'WEBSITE_FORM',
        name: 'Jane Doe',
        phone: '0987654321',
        interestType: 'BOTH',
        marketingConsent: { granted: true, channels: [] },
        captchaToken: 'valid-token'
      };

      await expect(useCase.execute(request)).rejects.toThrow(ValidationError);
    });
  });

  describe('AssignLeadUseCase', () => {
    it('should successfully assign a lead', async () => {
      const useCase = new AssignLeadUseCase(mockLeadRepo);
      mockLeadRepo.findById.mockResolvedValue(sampleLead);
      mockLeadRepo.update.mockResolvedValue({ ...sampleLead, assignedToId: 'user_1', version: 1 });

      const result = await useCase.execute('lead_1', 'user_1', 0);
      
      expect(mockLeadRepo.update).toHaveBeenCalledWith('lead_1', { assignedToId: 'user_1' }, 0);
      expect(result.assignedToId).toBe('user_1');
    });

    it('should throw ConflictError on version mismatch', async () => {
      const useCase = new AssignLeadUseCase(mockLeadRepo);
      mockLeadRepo.findById.mockResolvedValue(sampleLead);
      mockLeadRepo.update.mockResolvedValue(null);

      await expect(useCase.execute('lead_1', 'user_1', 0)).rejects.toThrow(ConflictError);
    });
  });

  describe('UpdateLeadStatusUseCase', () => {
    it('should throw ValidationError if changing to CONTACTED without an assignment', async () => {
      const useCase = new UpdateLeadStatusUseCase(mockLeadRepo);
      
      // lead with no assignedToId
      mockLeadRepo.findById.mockResolvedValue(sampleLead); 

      await expect(useCase.execute('lead_1', 'CONTACTED', 0)).rejects.toThrow(ValidationError);
    });

    it('should successfully update status', async () => {
      const useCase = new UpdateLeadStatusUseCase(mockLeadRepo);
      
      mockLeadRepo.findById.mockResolvedValue({ ...sampleLead, assignedToId: 'user_1' });
      mockLeadRepo.update.mockResolvedValue({ ...sampleLead, status: 'CONTACTED', version: 1 });

      const result = await useCase.execute('lead_1', 'CONTACTED', 0);
      
      expect(mockLeadRepo.update).toHaveBeenCalledWith('lead_1', { status: 'CONTACTED' }, 0);
      expect(result.status).toBe('CONTACTED');
    });
  });
});
