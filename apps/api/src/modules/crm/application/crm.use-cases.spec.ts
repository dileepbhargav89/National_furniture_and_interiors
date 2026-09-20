import { CrmUseCases } from './crm.use-cases';
import {
  CustomerRepository,
  LeadActivityRepository,
  LeadStatusHistoryRepository,
  SalesRepresentativeRepository,
} from './ports';
import {
  Customer,
  LeadActivity,
  LeadStatusTransition,
  SalesRepresentative,
} from '../domain/crm.types';
import { NotFoundError } from '../../../core/exceptions';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';

describe('CrmUseCases', () => {
  let useCases: CrmUseCases;
  let customerRepo: Mocked<CustomerRepository>;
  let activityRepo: Mocked<LeadActivityRepository>;
  let statusRepo: Mocked<LeadStatusHistoryRepository>;
  let salesRepo: Mocked<SalesRepresentativeRepository>;

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
    salesRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      findLeastLoadedRep: vi.fn(),
    };

    useCases = new CrmUseCases(customerRepo, activityRepo, statusRepo, salesRepo);
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
      const expectedOutput = {
        id: 'trans-1',
        changedAt: new Date(),
        ...input,
      } as LeadStatusTransition;

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

  describe('getPipeline', () => {
    it('sorts inquiries in reverse chronological order and elevates priority to HOT for recent inquiries', async () => {
      const olderDate = new Date(Date.now() - 5 * 24 * 3600 * 1000); // 5 days ago
      const recentDate = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago

      const olderCustomer: Customer = {
        id: 'cust-older',
        customerCode: 'C-OLD',
        name: 'Older Lead',
        email: 'older@example.com',
        phone: '9999911111',
        tags: [],
        clientTier: 'PROSPECT',
        propertyDetails: { community: 'Whitefield' },
        estimatedDealValue: 30000000, // < 5L would be COLD
        currentPipelineStage: 'NEW_INQUIRY',
        acquisitionSource: 'WEBSITE_FORM',
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        createdAt: olderDate,
        updatedAt: olderDate,
        isDeleted: false,
        version: 1,
      };

      const recentCustomer: Customer = {
        id: 'cust-recent',
        customerCode: 'C-REC',
        name: 'Dileep Bhargav',
        email: 'dileep@example.com',
        phone: '9109059791',
        tags: [],
        clientTier: 'PROSPECT',
        propertyDetails: { community: 'Indiranagar' },
        estimatedDealValue: 30000000, // < 5L would normally be COLD, but within 48h must be elevated to HOT
        currentPipelineStage: 'NEW_INQUIRY',
        acquisitionSource: 'WEBSITE_FORM',
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        createdAt: recentDate,
        updatedAt: recentDate,
        isDeleted: false,
        version: 1,
      };

      customerRepo.findAll.mockResolvedValue([olderCustomer, recentCustomer]);

      const stages = await useCases.getPipeline();
      const newInquiryStage = stages.find((s) => s.id === 'NEW_INQUIRY');

      expect(newInquiryStage).toBeDefined();
      expect(newInquiryStage?.deals).toHaveLength(2);

      // Verify reverse-chronological sorting: recentCustomer MUST be first
      expect(newInquiryStage?.deals[0]?.id).toBe('cust-recent');
      expect(newInquiryStage?.deals[1]?.id).toBe('cust-older');

      // Verify dynamic priority elevation to HOT for leads created within 48h
      expect(newInquiryStage?.deals[0]?.priority).toBe('HOT');
      // Verify older lead priority remains COLD based on estimated deal value
      expect(newInquiryStage?.deals[1]?.priority).toBe('COLD');

      // Verify createdAt and acquisitionSource propagation
      expect(newInquiryStage?.deals[0]?.createdAt).toEqual(recentDate);
      expect(newInquiryStage?.deals[0]?.acquisitionSource).toBe('WEBSITE_FORM');
    });

    it('should map consultationBooking to PipelineDeal and assign HOT priority', async () => {
      const mockCustomer: Customer = {
        id: 'cust-consult-1',
        customerCode: 'NFI-LEAD-999',
        name: 'Kavita Rao',
        email: 'kavita@test.com',
        phone: '9845012345',
        tags: ['STOREFRONT_LEAD', 'CONSULTATION_BOOKED'],
        clientTier: 'HIGH_NET_WORTH',
        estimatedDealValue: 18000000,
        currentPipelineStage: 'STUDIO_CONSULTATION',
        consultationBooking: {
          consultationType: 'STUDIO_VISIT',
          studioLocation: 'INDIRANAGAR',
          scheduledDate: '2026-09-25',
          timeSlot: '11:30 AM - 01:00 PM',
        },
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        createdAt: new Date(Date.now() - 5 * 86400000), // 5 days old
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      customerRepo.findAll.mockResolvedValue([mockCustomer]);
      const pipeline = await useCases.getPipeline();
      const studioStage = pipeline.find((s) => s.id === 'STUDIO_CONSULTATION');
      expect(studioStage).toBeDefined();
      expect(studioStage?.deals.length).toBe(1);
      const deal = studioStage!.deals[0]!;
      expect(deal.consultationBooking).toBeDefined();
      expect(deal.consultationBooking?.studioLocation).toBe('INDIRANAGAR');
      expect(deal.consultationBooking?.scheduledDate).toBe('2026-09-25');
      expect(deal.priority).toBe('HOT');
    });
  });

  describe('assignSalesRep', () => {
    it('assigns consultant to deal and logs activity note', async () => {
      const mockCustomer: Customer = {
        id: 'deal-1',
        customerCode: 'C-1',
        name: 'Patron',
        email: 'patron@example.com',
        phone: '9988776655',
        tags: [],
        clientTier: 'HIGH_NET_WORTH',
        estimatedDealValue: 200000000,
        currentPipelineStage: 'NEW_INQUIRY',
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      const mockRep: SalesRepresentative = {
        id: 'rep-1',
        userId: 'u-1',
        name: 'Priya Sharma',
        email: 'priya@nfi.in',
        phone: '9845011111',
        specialization: 'LUXURY_RESIDENTIAL',
        status: 'ACTIVE',
        activeLeadsCount: 3,
        maxCapacity: 15,
        monthlyTarget: 50000000,
        achievedRevenue: 20000000,
        wonDealsCount: 2,
        conversionRate: 35.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCustomer: Customer = {
        ...mockCustomer,
        assignedRepId: 'rep-1',
        assignedRepName: 'Priya Sharma',
      };

      customerRepo.findById.mockResolvedValue(mockCustomer);
      salesRepo.findById.mockResolvedValue(mockRep);
      customerRepo.update.mockResolvedValue(updatedCustomer);
      salesRepo.update.mockResolvedValue(mockRep);
      activityRepo.save.mockResolvedValue({
        id: 'act-1',
        leadId: 'deal-1',
        type: 'NOTE',
        summary: 'Assigned',
        performedBy: 'Admin',
        occurredAt: new Date(),
      });

      const result = await useCases.assignSalesRep('deal-1', 'rep-1', 'Admin');

      expect(customerRepo.update).toHaveBeenCalledWith('deal-1', {
        assignedRepId: 'rep-1',
        assignedRepName: 'Priya Sharma',
      });
      expect(salesRepo.update).toHaveBeenCalledWith('rep-1', {
        activeLeadsCount: 4,
      });
      expect(activityRepo.save).toHaveBeenCalled();
      expect(result.assignedRepName).toBe('Priya Sharma');
    });
  });

  describe('updateLeadPipelineStage', () => {
    it('transitions deal to new stage, records transition history, and saves activity', async () => {
      const mockCustomer: Customer = {
        id: 'deal-1',
        customerCode: 'C-1',
        name: 'Patron',
        email: 'patron@example.com',
        phone: '9988776655',
        tags: [],
        clientTier: 'HIGH_NET_WORTH',
        estimatedDealValue: 200000000,
        currentPipelineStage: 'NEW_INQUIRY',
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      const updatedCustomer: Customer = {
        ...mockCustomer,
        currentPipelineStage: 'QUALIFIED',
      };

      customerRepo.findById.mockResolvedValue(mockCustomer);
      customerRepo.update.mockResolvedValue(updatedCustomer);
      statusRepo.save.mockResolvedValue({
        id: 'trans-1',
        leadId: 'deal-1',
        fromStatus: 'NEW_INQUIRY',
        toStatus: 'QUALIFIED',
        changedBy: 'Sales Lead',
        reason: 'Customer confirmed budget',
        changedAt: new Date(),
      });
      activityRepo.save.mockResolvedValue({
        id: 'act-1',
        leadId: 'deal-1',
        type: 'STATUS_CHANGE',
        summary: 'Stage changed',
        performedBy: 'Sales Lead',
        occurredAt: new Date(),
      });

      const result = await useCases.updateLeadPipelineStage(
        'deal-1',
        'QUALIFIED',
        'Customer confirmed budget',
        'Sales Lead',
      );

      expect(customerRepo.update).toHaveBeenCalledWith('deal-1', {
        currentPipelineStage: 'QUALIFIED',
      });
      expect(statusRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          leadId: 'deal-1',
          fromStatus: 'NEW_INQUIRY',
          toStatus: 'QUALIFIED',
          reason: 'Customer confirmed budget',
        }),
      );
      expect(activityRepo.save).toHaveBeenCalled();
      expect(result.currentPipelineStage).toBe('QUALIFIED');
    });
  });
});
