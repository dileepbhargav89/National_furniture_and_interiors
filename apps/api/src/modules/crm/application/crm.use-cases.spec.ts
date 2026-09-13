import { CrmUseCases } from './crm.use-cases';
import { CustomerRepository, LeadActivityRepository, LeadStatusHistoryRepository } from './ports';
import { Customer, LeadActivity, LeadStatusTransition } from '../domain/crm.types';
import { NotFoundError } from '../../../core/exceptions';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

describe('CrmUseCases', () => {
  let useCases: CrmUseCases;
  let customerRepo: Mocked<CustomerRepository>;
  let activityRepo: Mocked<LeadActivityRepository>;
  let statusRepo: Mocked<LeadStatusHistoryRepository>;

  beforeEach(() => {
    customerRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    };
    activityRepo = {
      findByLeadId: vi.fn(),
      save: vi.fn(),
      findAllRecent: vi.fn(),
    };
    statusRepo = {
      findByLeadId: vi.fn(),
      save: vi.fn(),
    };

    useCases = new CrmUseCases(customerRepo, activityRepo, statusRepo);
  });

  describe('getCustomerProfile', () => {
    it('should return customer profile when found', async () => {
      const mockCustomer = { id: 'cust-1', customerCode: 'C1' } as Customer;
      customerRepo.findById.mockResolvedValue(mockCustomer);

      const result = await useCases.getCustomerProfile('cust-1');
      expect(result).toEqual(mockCustomer);
      expect(customerRepo.findById).toHaveBeenCalledWith('cust-1');
    });

    it('should throw NotFoundError when not found', async () => {
      customerRepo.findById.mockResolvedValue(null);

      await expect(useCases.getCustomerProfile('cust-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCustomerProfileByUserId', () => {
    it('should return customer profile by user id', async () => {
      const mockCustomer = { id: 'cust-1', userId: 'user-1' } as Customer;
      customerRepo.findByUserId.mockResolvedValue(mockCustomer);

      const result = await useCases.getCustomerProfileByUserId('user-1');
      expect(result).toEqual(mockCustomer);
      expect(customerRepo.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundError when user not found', async () => {
      customerRepo.findByUserId.mockResolvedValue(null);

      await expect(useCases.getCustomerProfileByUserId('user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createCustomerProfile', () => {
    it('should create and return the customer profile', async () => {
      const input = {
        userId: 'user-1',
        customerCode: 'C1',
        name: 'Client One',
        email: 'client@example.com',
        phone: '+919876543210',
        clientTier: 'HIGH_NET_WORTH',
        estimatedDealValue: 150000000,
        currentPipelineStage: 'QUALIFIED',
        tags: [],
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
      } as Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted' | 'deletedAt'>;
      
      const expected = { id: 'cust-1', ...input } as Customer;
      customerRepo.save.mockResolvedValue(expected);

      const result = await useCases.createCustomerProfile(input);
      expect(result).toEqual(expected);
      expect(customerRepo.save).toHaveBeenCalledWith(input);
    });
  });

  describe('updateCustomerProfile', () => {
    it('should update and return the customer profile', async () => {
      const updates = { tags: ['VIP'] };
      const expected = { id: 'cust-1', tags: ['VIP'] } as Customer;
      
      customerRepo.update.mockResolvedValue(expected);

      const result = await useCases.updateCustomerProfile('cust-1', updates);
      expect(result).toEqual(expected);
      expect(customerRepo.update).toHaveBeenCalledWith('cust-1', updates);
    });

    it('should throw NotFoundError if customer not found', async () => {
      customerRepo.update.mockResolvedValue(null);
      await expect(useCases.updateCustomerProfile('cust-1', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('recordLeadActivity', () => {
    it('should save and return the lead activity', async () => {
      const input = {
        leadId: 'lead-1',
        type: 'CALL',
        summary: 'Called the lead',
        performedBy: 'user-1',
      } as const;
      const expectedOutput = { id: 'act-1', occurredAt: new Date(), ...input } as LeadActivity;

      activityRepo.save.mockResolvedValue(expectedOutput);

      const result = await useCases.recordLeadActivity(input);
      expect(result).toEqual(expectedOutput);
      expect(activityRepo.save).toHaveBeenCalledWith(input);
    });
  });

  describe('getLeadActivities', () => {
    it('should return activities for a lead', async () => {
      const mockActivities = [{ id: 'act-1' }] as LeadActivity[];
      activityRepo.findByLeadId.mockResolvedValue(mockActivities);

      const result = await useCases.getLeadActivities('lead-1');
      expect(result).toEqual(mockActivities);
      expect(activityRepo.findByLeadId).toHaveBeenCalledWith('lead-1');
    });
  });

  describe('trackLeadStatusTransition', () => {
    it('should save and return a status transition', async () => {
      const input = {
        leadId: 'lead-1',
        fromStatus: 'NEW',
        toStatus: 'CONTACTED',
        changedBy: 'user-1',
      } as const;
      const expectedOutput = { id: 'trans-1', changedAt: new Date(), ...input } as LeadStatusTransition;

      statusRepo.save.mockResolvedValue(expectedOutput);

      const result = await useCases.trackLeadStatusTransition(input);
      expect(result).toEqual(expectedOutput);
      expect(statusRepo.save).toHaveBeenCalledWith(input);
    });
  });

  describe('getLeadStatusHistory', () => {
    it('should return status history for a lead', async () => {
      const mockHistory = [{ id: 'trans-1' }] as LeadStatusTransition[];
      statusRepo.findByLeadId.mockResolvedValue(mockHistory);

      const result = await useCases.getLeadStatusHistory('lead-1');
      expect(result).toEqual(mockHistory);
      expect(statusRepo.findByLeadId).toHaveBeenCalledWith('lead-1');
    });
  });
});
