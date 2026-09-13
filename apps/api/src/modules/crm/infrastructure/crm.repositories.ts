import { Types } from 'mongoose';
import { CustomerRepository, LeadActivityRepository, LeadStatusHistoryRepository, SalesRepresentativeRepository } from '../application/ports';
import { Customer, LeadActivity, LeadActivityDirection, LeadActivityOutcome, LeadActivityType, LeadStatusTransition, PipelineStageId, PreferredStudio, SalesRepresentative, SalesRepSpecialization, SalesRepStatus, UpdateCustomerInput } from '../domain/crm.types';
import { CustomerModel, ICustomerDocument, LeadActivityModel, ILeadActivityDocument, LeadStatusHistoryModel, ILeadStatusTransitionDocument, SalesRepresentativeModel, ISalesRepresentativeDocument } from './crm.schemas';

export class MongoCustomerRepository implements CustomerRepository {
  private mapToDomain(doc: ICustomerDocument): Customer {
    return {
      id: doc._id.toString(),
      ...(doc.userId ? { userId: doc.userId.toString() } : {}),
      customerCode: doc.customerCode,
      name: doc.name || 'Client',
      email: doc.email || '',
      phone: doc.phone || '',
      tags: doc.tags || [],
      clientTier: (doc.clientTier as any) || 'PROSPECT',
      ...(doc.preferredStudio ? { preferredStudio: doc.preferredStudio as PreferredStudio } : {}),
      ...(doc.propertyDetails ? { 
        propertyDetails: {
          ...(doc.propertyDetails.community ? { community: doc.propertyDetails.community } : {}),
          ...(doc.propertyDetails.configuration ? { configuration: doc.propertyDetails.configuration } : {}),
          ...(doc.propertyDetails.estimatedAreaSqFt !== undefined ? { estimatedAreaSqFt: doc.propertyDetails.estimatedAreaSqFt } : {}),
          ...(doc.propertyDetails.possessionDate ? { possessionDate: doc.propertyDetails.possessionDate } : {}),
        }
      } : {}),
      estimatedDealValue: doc.estimatedDealValue || 0,
      currentPipelineStage: (doc.currentPipelineStage as PipelineStageId) || 'NEW_INQUIRY',
      ...(doc.assignedRepId ? { assignedRepId: doc.assignedRepId } : {}),
      ...(doc.assignedRepName ? { assignedRepName: doc.assignedRepName } : {}),
      lifetimeValue: doc.lifetimeValue || 0,
      totalOrders: doc.totalOrders || 0,
      totalDesignProjects: doc.totalDesignProjects || 0,
      ...(doc.preferredContactChannel ? { preferredContactChannel: doc.preferredContactChannel } : {}),
      ...(doc.acquisitionSource ? { acquisitionSource: doc.acquisitionSource } : {}),
      ...(doc.notes ? { notes: doc.notes } : {}),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.createdBy ? { createdBy: doc.createdBy } : {}),
      ...(doc.updatedBy ? { updatedBy: doc.updatedBy } : {}),
      isDeleted: doc.isDeleted,
      ...(doc.deletedAt ? { deletedAt: doc.deletedAt } : {}),
      version: doc.version,
    };
  }

  async findById(id: string): Promise<Customer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CustomerModel.findOne({ _id: id, isDeleted: false });
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    const query = Types.ObjectId.isValid(userId) ? { userId: new Types.ObjectId(userId) } : { userId };
    const doc = await CustomerModel.findOne({ ...query, isDeleted: false });
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAll(filter?: { stage?: string; repId?: string; search?: string }): Promise<Customer[]> {
    const query: Record<string, unknown> = { isDeleted: false };
    if (filter?.stage && filter.stage !== 'all') {
      query.currentPipelineStage = filter.stage;
    }
    if (filter?.repId && filter.repId !== 'all') {
      query.assignedRepId = filter.repId;
    }
    if (filter?.search) {
      const regex = new RegExp(filter.search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { customerCode: regex },
        { 'propertyDetails.community': regex },
      ];
    }
    const docs = await CustomerModel.find(query).sort({ updatedAt: -1 });
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async count(): Promise<number> {
    return CustomerModel.countDocuments({ isDeleted: false });
  }

  async save(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted' | 'deletedAt'>): Promise<Customer> {
    const validUserId = customer.userId && Types.ObjectId.isValid(customer.userId)
      ? new Types.ObjectId(customer.userId)
      : undefined;
    const doc = new CustomerModel({
      ...customer,
      ...(validUserId ? { userId: validUserId } : {}),
      isDeleted: false,
    });
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }

  async update(id: string, updates: UpdateCustomerInput): Promise<Customer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await CustomerModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates, $inc: { version: 1 }, updatedAt: new Date() },
      { new: true }
    );
    return doc ? this.mapToDomain(doc) : null;
  }
}

export class MongoSalesRepresentativeRepository implements SalesRepresentativeRepository {
  private mapToDomain(doc: ISalesRepresentativeDocument): SalesRepresentative {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      ...(doc.avatarUrl ? { avatarUrl: doc.avatarUrl } : {}),
      specialization: doc.specialization as SalesRepSpecialization,
      monthlyTarget: doc.monthlyTarget,
      achievedRevenue: doc.achievedRevenue,
      activeLeadsCount: doc.activeLeadsCount,
      maxCapacity: doc.maxCapacity,
      wonDealsCount: doc.wonDealsCount,
      conversionRate: doc.conversionRate,
      status: doc.status as SalesRepStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(filter?: { status?: string }): Promise<SalesRepresentative[]> {
    const query: Record<string, unknown> = {};
    if (filter?.status) {
      query.status = filter.status;
    }
    const docs = await SalesRepresentativeModel.find(query).sort({ achievedRevenue: -1 });
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findById(id: string): Promise<SalesRepresentative | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await SalesRepresentativeModel.findById(id);
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByUserId(userId: string): Promise<SalesRepresentative | null> {
    const doc = await SalesRepresentativeModel.findOne({ userId });
    return doc ? this.mapToDomain(doc) : null;
  }

  async save(rep: Omit<SalesRepresentative, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesRepresentative> {
    const doc = new SalesRepresentativeModel(rep);
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }

  async update(id: string, updates: Partial<SalesRepresentative>): Promise<SalesRepresentative | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await SalesRepresentativeModel.findByIdAndUpdate(
      id,
      { $set: updates, updatedAt: new Date() },
      { new: true }
    );
    return doc ? this.mapToDomain(doc) : null;
  }

  async findLeastLoadedRep(specialization?: string): Promise<SalesRepresentative | null> {
    const query: Record<string, unknown> = { status: 'ACTIVE' };
    if (specialization) {
      query.specialization = specialization;
    }
    // Find active reps sorted by activeLeadsCount ascending (least loaded)
    const doc = await SalesRepresentativeModel.findOne(query).sort({ activeLeadsCount: 1 });
    if (!doc && specialization) {
      // Fallback to any active rep if no specialist found
      const fallback = await SalesRepresentativeModel.findOne({ status: 'ACTIVE' }).sort({ activeLeadsCount: 1 });
      return fallback ? this.mapToDomain(fallback) : null;
    }
    return doc ? this.mapToDomain(doc) : null;
  }

  async seedIfEmpty(defaults: Array<Omit<SalesRepresentative, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const count = await SalesRepresentativeModel.countDocuments();
    if (count === 0) {
      await SalesRepresentativeModel.insertMany(defaults);
    }
  }
}

export class MongoLeadActivityRepository implements LeadActivityRepository {
  private mapToDomain(doc: ILeadActivityDocument): LeadActivity {
    return {
      id: doc._id.toString(),
      leadId: doc.leadId.toString(),
      type: doc.type as LeadActivityType,
      ...(doc.direction ? { direction: doc.direction as LeadActivityDirection } : {}),
      summary: doc.summary,
      ...(doc.outcome ? { outcome: doc.outcome as LeadActivityOutcome } : {}),
      performedBy: doc.performedBy,
      occurredAt: doc.occurredAt,
      ...(doc.scheduledFollowUpAt ? { scheduledFollowUpAt: doc.scheduledFollowUpAt } : {}),
      ...(doc.isFollowUpCompleted !== undefined ? { isFollowUpCompleted: doc.isFollowUpCompleted } : {}),
      ...(doc.metadata ? { metadata: doc.metadata as Record<string, unknown> } : {}),
    };
  }

  async findByLeadId(leadId: string): Promise<LeadActivity[]> {
    if (!Types.ObjectId.isValid(leadId)) return [];
    const docs = await LeadActivityModel.find({ leadId: new Types.ObjectId(leadId) }).sort({ occurredAt: -1 });
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findAllRecent(limit = 20): Promise<LeadActivity[]> {
    const docs = await LeadActivityModel.find().sort({ occurredAt: -1 }).limit(limit);
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async save(activity: Omit<LeadActivity, 'id' | 'occurredAt'>): Promise<LeadActivity> {
    const validLeadId = Types.ObjectId.isValid(activity.leadId)
      ? new Types.ObjectId(activity.leadId)
      : new Types.ObjectId();
    const doc = new LeadActivityModel({
      ...activity,
      leadId: validLeadId,
    });
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }
}

export class MongoLeadStatusHistoryRepository implements LeadStatusHistoryRepository {
  private mapToDomain(doc: ILeadStatusTransitionDocument): LeadStatusTransition {
    return {
      id: doc._id.toString(),
      leadId: doc.leadId.toString(),
      fromStatus: doc.fromStatus,
      toStatus: doc.toStatus,
      changedBy: doc.changedBy,
      ...(doc.reason ? { reason: doc.reason } : {}),
      changedAt: doc.changedAt,
    };
  }

  async findByLeadId(leadId: string): Promise<LeadStatusTransition[]> {
    if (!Types.ObjectId.isValid(leadId)) return [];
    const docs = await LeadStatusHistoryModel.find({ leadId: new Types.ObjectId(leadId) }).sort({ changedAt: -1 });
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async save(transition: Omit<LeadStatusTransition, 'id' | 'changedAt'>): Promise<LeadStatusTransition> {
    const validLeadId = Types.ObjectId.isValid(transition.leadId)
      ? new Types.ObjectId(transition.leadId)
      : new Types.ObjectId();
    const doc = new LeadStatusHistoryModel({
      ...transition,
      leadId: validLeadId,
    });
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }
}

