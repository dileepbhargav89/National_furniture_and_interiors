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
  PipelineDeal,
  PipelineStageId,
  PipelineStageInfo,
  CrmKpis,
  CustomerDossier,
  SalesRepresentative,
  LeadPriority,
  UpdateCustomerInput,
} from '../domain/crm.types';
import { NotFoundError, ValidationError } from '../../../core/exceptions';

const STAGE_CONFIG: Record<PipelineStageId, { label: string; probability: number }> = {
  NEW_INQUIRY: { label: 'New Inquiry', probability: 10 },
  QUALIFIED: { label: 'Qualified & Discovery', probability: 30 },
  STUDIO_CONSULTATION: { label: 'Studio Consultation', probability: 50 },
  DESIGN_PROPOSAL_SENT: { label: 'Design Proposal Sent', probability: 75 },
  NEGOTIATION: { label: 'Negotiation & Finishes', probability: 90 },
  CLOSED_WON: { label: 'Closed Won', probability: 100 },
  CLOSED_LOST: { label: 'Closed Lost', probability: 0 },
};

const STAGE_ORDER: PipelineStageId[] = [
  'NEW_INQUIRY',
  'QUALIFIED',
  'STUDIO_CONSULTATION',
  'DESIGN_PROPOSAL_SENT',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export class CrmUseCases {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly leadActivityRepository: LeadActivityRepository,
    private readonly leadStatusHistoryRepository: LeadStatusHistoryRepository,
    private readonly salesRepresentativeRepository?: SalesRepresentativeRepository,
  ) {}

  // ---------------- Customer Profile & Core CRUD ----------------

  async getCustomerProfile(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return customer;
  }

  async getCustomerProfileByUserId(userId: string): Promise<Customer> {
    const customer = await this.customerRepository.findByUserId(userId);
    if (!customer) {
      throw new NotFoundError('Customer not found for the given user');
    }
    return customer;
  }

  async createCustomerProfile(
    input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted' | 'deletedAt'>,
  ): Promise<Customer> {
    return this.customerRepository.save(input);
  }

  async updateCustomerProfile(customerId: string, updates: UpdateCustomerInput): Promise<Customer> {
    const updated = await this.customerRepository.update(customerId, updates);
    if (!updated) {
      throw new NotFoundError('Customer not found');
    }
    return updated;
  }

  // ---------------- Pipeline & Kanban Management ----------------

  private mapCustomerToPipelineDeal(c: Customer): PipelineDeal {
    const stage = c.currentPipelineStage || 'NEW_INQUIRY';
    const prob = STAGE_CONFIG[stage]?.probability ?? 10;
    const dealValue = c.estimatedDealValue || 0;
    const weightedVal = Math.round((dealValue * prob) / 100);

    const now = new Date().getTime();
    const createdTime = new Date(c.createdAt || c.updatedAt).getTime();
    const updatedTime = new Date(c.updatedAt || c.createdAt).getTime();
    const isNewRecent = now - createdTime < 48 * 60 * 60 * 1000; // within 48h

    // Calculate priority based on value, age, booked consultation, and swatch kit order
    let priority: LeadPriority = 'WARM';
    if (
      c.consultationBooking ||
      c.swatchKitOrder ||
      dealValue >= 200000000 ||
      (stage === 'NEW_INQUIRY' && isNewRecent)
    ) {
      priority = 'HOT';
    } else if (dealValue < 50000000 && !isNewRecent) {
      priority = 'COLD';
    }

    const daysInStage = Math.max(1, Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24)));

    return {
      id: c.id,
      customerId: c.id,
      customerCode: c.customerCode,
      clientName: c.name,
      email: c.email,
      phone: c.phone,
      community: c.propertyDetails?.community || 'Bengaluru',
      configuration: c.propertyDetails?.configuration || 'Custom Woodwork',
      estimatedDealValue: dealValue,
      weightedValue: weightedVal,
      stage,
      probability: prob,
      clientTier: c.clientTier,
      priority,
      ...(c.consultationBooking ? { consultationBooking: c.consultationBooking } : {}),
      ...(c.swatchKitOrder ? { swatchKitOrder: c.swatchKitOrder } : {}),
      ...(c.assignedRepId ? { assignedRepId: c.assignedRepId } : {}),
      ...(c.assignedRepName ? { assignedRepName: c.assignedRepName } : {}),
      daysInStage,
      ...(c.notes ? { notes: c.notes } : {}),
      createdAt: c.createdAt,
      ...(c.acquisitionSource ? { acquisitionSource: c.acquisitionSource } : {}),
      updatedAt: c.updatedAt || new Date(),
    };
  }

  async getPipeline(filter?: { repId?: string; search?: string }): Promise<PipelineStageInfo[]> {
    const customers = await this.customerRepository.findAll(filter);

    // Group deals by stage
    const groupedDeals = new Map<PipelineStageId, PipelineDeal[]>();
    STAGE_ORDER.forEach((stageId) => groupedDeals.set(stageId, []));

    customers.forEach((c) => {
      const deal = this.mapCustomerToPipelineDeal(c);
      const stageList = groupedDeals.get(deal.stage) || [];
      stageList.push(deal);
      groupedDeals.set(deal.stage, stageList);
    });

    // Enforce reverse-chronological sorting within each stage (newest inquiries first)
    STAGE_ORDER.forEach((stageId) => {
      const list = groupedDeals.get(stageId) || [];
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.updatedAt).getTime();
        const timeB = new Date(b.createdAt || b.updatedAt).getTime();
        return timeB - timeA;
      });
      groupedDeals.set(stageId, list);
    });

    return STAGE_ORDER.map((stageId) => {
      const deals = groupedDeals.get(stageId) || [];
      const totalValue = deals.reduce((acc, d) => acc + d.estimatedDealValue, 0);
      return {
        id: stageId,
        label: STAGE_CONFIG[stageId].label,
        probability: STAGE_CONFIG[stageId].probability,
        totalValue,
        count: deals.length,
        deals,
      };
    });
  }

  async updateLeadPipelineStage(
    dealId: string,
    newStage: PipelineStageId,
    reason?: string,
    performedBy = 'Sales Manager',
  ): Promise<Customer> {
    if (!STAGE_CONFIG[newStage]) {
      throw new ValidationError(`Invalid pipeline stage: ${newStage}`);
    }

    const customer = await this.customerRepository.findById(dealId);
    if (!customer) {
      throw new NotFoundError(`CRM deal with ID ${dealId} not found`);
    }

    const previousStage = customer.currentPipelineStage;
    if (previousStage === newStage) {
      return customer;
    }

    // Update customer stage
    const updated = await this.customerRepository.update(dealId, {
      currentPipelineStage: newStage,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update stage');
    }

    // Record transition history
    await this.leadStatusHistoryRepository.save({
      leadId: dealId,
      fromStatus: previousStage,
      toStatus: newStage,
      changedBy: performedBy,
      ...(reason ? { reason } : {}),
    });

    // Record activity note
    await this.leadActivityRepository.save({
      leadId: dealId,
      type: 'STATUS_CHANGE',
      summary: `Deal stage advanced from "${STAGE_CONFIG[previousStage]?.label || previousStage}" to "${STAGE_CONFIG[newStage].label}".${reason ? ` Note: ${reason}` : ''}`,
      performedBy,
    });

    // If Closed Won, update rep's won deals and revenue
    if (newStage === 'CLOSED_WON' && updated.assignedRepId && this.salesRepresentativeRepository) {
      const rep = await this.salesRepresentativeRepository.findById(updated.assignedRepId);
      if (rep) {
        await this.salesRepresentativeRepository.update(rep.id, {
          achievedRevenue: rep.achievedRevenue + (updated.estimatedDealValue || 0),
          wonDealsCount: rep.wonDealsCount + 1,
        });
      }
    }

    return updated;
  }

  // ---------------- Executive CRM KPIs ----------------

  async getCrmKpis(): Promise<CrmKpis> {
    const customers = await this.customerRepository.findAll();

    let totalPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonDealsCount = 0;
    let closedLostCount = 0;
    let wonRevenue = 0;
    let activeDealsCount = 0;

    customers.forEach((c) => {
      const stage = c.currentPipelineStage || 'NEW_INQUIRY';
      const val = c.estimatedDealValue || 0;
      const prob = STAGE_CONFIG[stage]?.probability ?? 10;

      if (stage === 'CLOSED_WON') {
        wonDealsCount += 1;
        wonRevenue += val;
      } else if (stage === 'CLOSED_LOST') {
        closedLostCount += 1;
      } else {
        activeDealsCount += 1;
        totalPipelineValue += val;
        weightedPipelineValue += Math.round((val * prob) / 100);
      }
    });

    const totalClosed = wonDealsCount + closedLostCount;
    const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 1000) / 10 : 36.5; // default benchmark
    const averageDealSize = wonDealsCount > 0 ? Math.round(wonRevenue / wonDealsCount) : 48500000; // default ₹4.85L

    // Calculate team target achievement rate
    let targetAchievementRate = 82.4;
    if (this.salesRepresentativeRepository) {
      const reps = await this.salesRepresentativeRepository.findAll();
      const totalTarget = reps.reduce((sum, r) => sum + r.monthlyTarget, 0);
      const totalAchieved = reps.reduce((sum, r) => sum + r.achievedRevenue, 0);
      if (totalTarget > 0) {
        targetAchievementRate = Math.round((totalAchieved / totalTarget) * 1000) / 10;
      }
    }

    return {
      totalPipelineValue,
      weightedPipelineValue,
      winRate,
      averageDealVelocityDays: 14.8,
      averageDealSize,
      activeDealsCount,
      wonDealsCount,
      targetAchievementRate,
    };
  }

  // ---------------- Sales Team Operations & Round-Robin ----------------

  async getSalesTeam(): Promise<SalesRepresentative[]> {
    if (!this.salesRepresentativeRepository) {
      return [];
    }
    const reps = await this.salesRepresentativeRepository.findAll();
    return reps;
  }

  async assignSalesRep(
    dealId: string,
    repId: string,
    performedBy = 'Sales Manager',
  ): Promise<Customer> {
    const customer = await this.customerRepository.findById(dealId);
    if (!customer) {
      throw new NotFoundError(`Customer/deal ${dealId} not found`);
    }

    let assignedRep: SalesRepresentative | null = null;

    if (this.salesRepresentativeRepository) {
      if (repId === 'AUTO') {
        // Automated round-robin based on least active load and capacity
        assignedRep = await this.salesRepresentativeRepository.findLeastLoadedRep();
      } else {
        assignedRep = await this.salesRepresentativeRepository.findById(repId);
      }
    }

    const assignedName =
      assignedRep?.name || (repId === 'AUTO' ? 'Design Concierge' : 'Assigned Consultant');
    const finalRepId = assignedRep?.id || repId;

    const updated = await this.customerRepository.update(dealId, {
      assignedRepId: finalRepId,
      assignedRepName: assignedName,
    });

    if (!updated) {
      throw new NotFoundError('Failed to assign sales representative');
    }

    // Update rep active counts if repo available
    if (assignedRep && this.salesRepresentativeRepository) {
      await this.salesRepresentativeRepository.update(assignedRep.id, {
        activeLeadsCount: assignedRep.activeLeadsCount + 1,
      });
      if (customer.assignedRepId && customer.assignedRepId !== assignedRep.id) {
        const oldRep = await this.salesRepresentativeRepository.findById(customer.assignedRepId);
        if (oldRep && oldRep.activeLeadsCount > 0) {
          await this.salesRepresentativeRepository.update(oldRep.id, {
            activeLeadsCount: oldRep.activeLeadsCount - 1,
          });
        }
      }
    }

    await this.leadActivityRepository.save({
      leadId: dealId,
      type: 'NOTE',
      summary: `Design consultant assigned: ${assignedName} (${repId === 'AUTO' ? 'Automated Capacity Recommendation' : 'Manual Assignment'}).`,
      performedBy,
    });

    return updated;
  }

  // ---------------- Customer 360 Dossier & Conversions ----------------

  async getCustomerDossier(customerId: string): Promise<CustomerDossier> {
    const customer = await this.getCustomerProfile(customerId);
    const deal = this.mapCustomerToPipelineDeal(customer);
    const activities = await this.leadActivityRepository.findByLeadId(customerId);
    const statusHistory = await this.leadStatusHistoryRepository.findByLeadId(customerId);

    return {
      customer,
      deal,
      activities,
      statusHistory,
      designProjects: [
        {
          id: `proj_${customer.id.substring(0, 8)}`,
          title: `${customer.propertyDetails?.community || 'Luxury Residence'} - ${customer.propertyDetails?.configuration || 'Full Home'}`,
          stage: '3D_CONCEPT_DESIGN',
          estimatedBudget: customer.estimatedDealValue || 185000000,
        },
      ],
      orders: [],
    };
  }

  async convertDealToProject(
    dealId: string,
    data: {
      projectName?: string | undefined;
      scope?: string | undefined;
      estimatedBudget?: number | undefined;
    },
    performedBy = 'Sales Consultant',
  ): Promise<{ projectId: string; dealId: string; message: string }> {
    const customer = await this.getCustomerProfile(dealId);

    // Advance deal to CLOSED_WON if not already
    await this.updateLeadPipelineStage(
      dealId,
      'CLOSED_WON',
      'Converted to Active Interior Design Project',
      performedBy,
    );

    const projectId = `dp_${Date.now()}`;
    await this.leadActivityRepository.save({
      leadId: dealId,
      type: 'NOTE',
      summary: `Deal converted into active Interior Design Project: ${data.projectName || customer.name + ' Residence'}. Project ID: ${projectId}.`,
      performedBy,
    });

    return {
      projectId,
      dealId,
      message: `Successfully converted lead to Interior Design Project ${projectId}`,
    };
  }

  async convertDealToOrder(
    dealId: string,
    data: { itemsDescription?: string | undefined; totalAmount?: number | undefined },
    performedBy = 'Sales Consultant',
  ): Promise<{ orderId: string; orderNumber: string; dealId: string; message: string }> {
    const customer = await this.getCustomerProfile(dealId);

    // Advance deal to CLOSED_WON
    await this.updateLeadPipelineStage(
      dealId,
      'CLOSED_WON',
      'Converted to Bespoke Furniture Order',
      performedBy,
    );

    const orderNumber = `NFI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord_${Date.now()}`;

    await this.leadActivityRepository.save({
      leadId: dealId,
      type: 'NOTE',
      summary: `Deal converted into bespoke furniture order: ${orderNumber}. Estimated Amount: ₹${((data.totalAmount || customer.estimatedDealValue || 0) / 100).toLocaleString('en-IN')}.`,
      performedBy,
    });

    return {
      orderId,
      orderNumber,
      dealId,
      message: `Successfully converted lead to Order ${orderNumber}`,
    };
  }

  // ---------------- Lead Activities ----------------

  async recordLeadActivity(
    activity: Omit<LeadActivity, 'id' | 'occurredAt'>,
  ): Promise<LeadActivity> {
    return this.leadActivityRepository.save(activity);
  }

  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return this.leadActivityRepository.findByLeadId(leadId);
  }

  async trackLeadStatusTransition(
    transition: Omit<LeadStatusTransition, 'id' | 'changedAt'>,
  ): Promise<LeadStatusTransition> {
    return this.leadStatusHistoryRepository.save(transition);
  }

  async getLeadStatusHistory(leadId: string): Promise<LeadStatusTransition[]> {
    return this.leadStatusHistoryRepository.findByLeadId(leadId);
  }
}
