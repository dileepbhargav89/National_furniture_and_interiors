import {
  ILeadRepository,
  CreateLeadInput,
  UpdateLeadInput,
  ListLeadsFilters,
} from '../application/ports';
import { Lead } from '../domain/leads.types';
import { LeadModel, ILeadDocument } from './leads.schemas';

export class MongoLeadRepository implements ILeadRepository {
  private mapToDomain(doc: ILeadDocument): Lead {
    return {
      id: doc._id.toString(),
      source: doc.source,
      ...(doc.sourceDetail ? { sourceDetail: doc.sourceDetail } : {}),
      name: doc.name,
      ...(doc.email ? { email: doc.email } : {}),
      phone: doc.phone,
      interestType: doc.interestType,
      ...(doc.projectType ? { projectType: doc.projectType } : {}),
      ...(doc.budgetRange ? { budgetRange: doc.budgetRange } : {}),
      ...(doc.timeline ? { timeline: doc.timeline } : {}),
      ...(doc.consultationBooking
        ? {
            consultationBooking: {
              consultationType: doc.consultationBooking.consultationType,
              ...(doc.consultationBooking.studioLocation
                ? { studioLocation: doc.consultationBooking.studioLocation }
                : {}),
              scheduledDate: doc.consultationBooking.scheduledDate,
              timeSlot: doc.consultationBooking.timeSlot,
              ...(doc.consultationBooking.propertyType
                ? { propertyType: doc.consultationBooking.propertyType }
                : {}),
              ...(doc.consultationBooking.meetingNotes
                ? { meetingNotes: doc.consultationBooking.meetingNotes }
                : {}),
              ...(doc.consultationBooking.calendarInviteSent !== undefined
                ? { calendarInviteSent: doc.consultationBooking.calendarInviteSent }
                : {}),
            },
          }
        : {}),
      ...(doc.swatchKitOrder
        ? {
            swatchKitOrder: {
              kitType: doc.swatchKitOrder.kitType,
              deliveryAddress: {
                line1: doc.swatchKitOrder.deliveryAddress.line1,
                ...(doc.swatchKitOrder.deliveryAddress.line2
                  ? { line2: doc.swatchKitOrder.deliveryAddress.line2 }
                  : {}),
                city: doc.swatchKitOrder.deliveryAddress.city,
                state: doc.swatchKitOrder.deliveryAddress.state,
                pincode: doc.swatchKitOrder.deliveryAddress.pincode,
              },
              depositAmount: doc.swatchKitOrder.depositAmount,
              isDepositRefundable: doc.swatchKitOrder.isDepositRefundable,
              dispatchStatus: doc.swatchKitOrder.dispatchStatus,
              ...(doc.swatchKitOrder.courierTrackingNumber
                ? { courierTrackingNumber: doc.swatchKitOrder.courierTrackingNumber }
                : {}),
            },
          }
        : {}),
      marketingConsent: {
        granted: doc.marketingConsent.granted,
        ...(doc.marketingConsent.grantedAt ? { grantedAt: doc.marketingConsent.grantedAt } : {}),
        ...(doc.marketingConsent.source ? { source: doc.marketingConsent.source } : {}),
        channels: doc.marketingConsent.channels,
      },
      score: doc.score,
      priority: doc.priority,
      status: doc.status,
      ...(doc.assignedToId ? { assignedToId: doc.assignedToId } : {}),
      ...(doc.convertedCustomerId ? { convertedCustomerId: doc.convertedCustomerId } : {}),
      ...(doc.convertedDesignProjectId
        ? { convertedDesignProjectId: doc.convertedDesignProjectId }
        : {}),
      ...(doc.convertedOrderId ? { convertedOrderId: doc.convertedOrderId } : {}),
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

  async create(input: CreateLeadInput): Promise<Lead> {
    const doc = new LeadModel({
      ...input,
      isDeleted: false,
    });
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }

  async findById(id: string): Promise<Lead | null> {
    const doc = await LeadModel.findOne({ _id: id, isDeleted: false });
    return doc ? this.mapToDomain(doc) : null;
  }

  async find(
    filters: ListLeadsFilters,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ leads: Lead[]; total: number }> {
    const query: Record<string, unknown> = { isDeleted: false };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.assignedToId) query.assignedToId = filters.assignedToId;

    const [docs, total] = await Promise.all([
      LeadModel.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
      LeadModel.countDocuments(query),
    ]);

    return {
      leads: docs.map((doc) => this.mapToDomain(doc)),
      total,
    };
  }

  async update(
    id: string,
    updates: UpdateLeadInput,
    expectedVersion: number,
  ): Promise<Lead | null> {
    const doc = await LeadModel.findOneAndUpdate(
      { _id: id, isDeleted: false, version: expectedVersion },
      { $set: updates, $inc: { version: 1 } },
      { new: true },
    );

    if (!doc) {
      // Could mean it doesn't exist, is deleted, or version mismatch
      return null;
    }
    return this.mapToDomain(doc);
  }

  async getFunnelMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
  }> {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (startDate) createdAtFilter.$gte = new Date(startDate);
      if (endDate) createdAtFilter.$lte = new Date(endDate);
      filter.createdAt = createdAtFilter;
    }

    const aggregation = await LeadModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'NEW'] }, 1, 0] } },
          contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'CONTACTED'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'QUALIFIED'] }, 1, 0] } },
          convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'CONVERTED'] }, 1, 0] } },
        },
      },
    ]);

    if (aggregation.length === 0) {
      return {
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
      };
    }

    return {
      totalLeads: aggregation[0].totalLeads,
      newLeads: aggregation[0].newLeads,
      contactedLeads: aggregation[0].contactedLeads,
      qualifiedLeads: aggregation[0].qualifiedLeads,
      convertedLeads: aggregation[0].convertedLeads,
    };
  }
}
