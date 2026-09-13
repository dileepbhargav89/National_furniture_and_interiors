import { IDesignProject, IDesignProjectRepository, DesignProjectStage } from '../../domain/design-projects.types';
import { DesignProjectModel } from '../models/design-project.model';

export class MongoDesignProjectRepository implements IDesignProjectRepository {
  async create(project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): Promise<IDesignProject> {
    const newProject = new DesignProjectModel({
      ...project,
      isDeleted: false,
      version: 1
    });
    
    await newProject.save();
    return this.mapToDomain(newProject);
  }

  async findById(id: string): Promise<IDesignProject | null> {
    const project = await DesignProjectModel.findOne({ _id: id, isDeleted: false }).lean().exec();
    return project ? this.mapToDomain(project) : null;
  }

  async findByProjectCode(code: string): Promise<IDesignProject | null> {
    const project = await DesignProjectModel.findOne({ projectCode: code, isDeleted: false }).lean().exec();
    return project ? this.mapToDomain(project) : null;
  }

  async findAll(filters?: { stage?: DesignProjectStage; assignedDesignerId?: string }, limit: number = 10, skip: number = 0): Promise<{ items: IDesignProject[], total: number }> {
    const query: any = { isDeleted: false };
    
    if (filters?.stage) {
      query.stage = filters.stage;
    }
    
    if (filters?.assignedDesignerId) {
      query.assignedDesignerId = filters.assignedDesignerId;
    }

    const [items, total] = await Promise.all([
      DesignProjectModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      DesignProjectModel.countDocuments(query).exec()
    ]);

    return {
      items: items.map(this.mapToDomain),
      total
    };
  }

  async update(id: string, updates: Partial<IDesignProject>, expectedVersion?: number): Promise<IDesignProject | null> {
    const doc = await DesignProjectModel.findOne({ _id: id, isDeleted: false }).exec();
    if (!doc) return null;

    if (expectedVersion !== undefined && doc.version !== expectedVersion) {
      throw new Error(`ConcurrencyError: Expected version ${expectedVersion} but found ${doc.version}`);
    }

    Object.assign(doc, updates);
    await doc.save();
    
    return this.mapToDomain(doc.toObject());
  }

  async getFunnelMetrics(startDate?: string, endDate?: string): Promise<{
    totalProjects: number;
    inConsultation: number;
    quotationSent: number;
    inProgress: number;
    completed: number;
  }> {
    const filter: any = { isDeleted: false };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const aggregation = await DesignProjectModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          inConsultation: { $sum: { $cond: [{ $in: ['$stage', ['LEAD_CAPTURED', 'QUALIFIED', 'CONSULTATION_SCHEDULED', 'SITE_VISIT_COMPLETED', 'PROPOSAL_IN_PROGRESS']] }, 1, 0] } },
          quotationSent: { $sum: { $cond: [{ $in: ['$stage', ['QUOTATION_SENT', 'CLIENT_REVIEW', 'REVISION']] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $in: ['$stage', ['APPROVED', 'ADVANCE_PAYMENT_COLLECTED', 'PROCUREMENT', 'EXECUTION_IN_PROGRESS', 'MILESTONE_PAYMENT_COLLECTED', 'QUALITY_CHECK']] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $in: ['$stage', ['HANDOVER', 'WARRANTY_AMC']] }, 1, 0] } }
        }
      }
    ]);

    if (aggregation.length === 0) {
      return { totalProjects: 0, inConsultation: 0, quotationSent: 0, inProgress: 0, completed: 0 };
    }

    return {
      totalProjects: aggregation[0].totalProjects,
      inConsultation: aggregation[0].inConsultation,
      quotationSent: aggregation[0].quotationSent,
      inProgress: aggregation[0].inProgress,
      completed: aggregation[0].completed,
    };
  }

  private mapToDomain(doc: any): IDesignProject {
    const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const project: any = { ...raw };
    if (project._id) project._id = project._id.toString();
    if (project.leadId) project.leadId = project.leadId.toString();
    if (project.customerId) project.customerId = project.customerId.toString();
    if (project.assignedDesignerId) project.assignedDesignerId = project.assignedDesignerId.toString();
    
    // Convert undefined to exactOptionalPropertyTypes if necessary
    if (project.leadId === null) project.leadId = undefined;
    if (project.assignedDesignerId === null) project.assignedDesignerId = undefined;
    if (project.deletedAt === null) project.deletedAt = undefined;
    if (project.deletedBy === null) project.deletedBy = undefined;
    if (project.createdBy === null) project.createdBy = undefined;
    if (project.updatedBy === null) project.updatedBy = undefined;
    
    if (project.propertyDetails) {
      if (project.propertyDetails.rooms === null) project.propertyDetails.rooms = undefined;
      if (project.propertyDetails.bhk === null) project.propertyDetails.bhk = undefined;
    }

    if (project.quotations) {
      project.quotations = project.quotations.map((q: any) => {
        if (q._id) q._id = q._id.toString();
        if (q.sentAt === null) q.sentAt = undefined;
        if (q.approvedAt === null) q.approvedAt = undefined;
        if (q.eSignatureRef === null) q.eSignatureRef = undefined;
        return q;
      });
    }

    if (project.milestones) {
      project.milestones = project.milestones.map((m: any) => {
        if (m._id) m._id = m._id.toString();
        if (m.paymentId === null) m.paymentId = undefined;
        return m;
      });
    }

    if (project.stageHistory) {
      project.stageHistory = project.stageHistory.map((h: any) => {
        if (h.changedBy) h.changedBy = h.changedBy.toString();
        if (h.note === null) h.note = undefined;
        return h;
      });
    }

    return project as IDesignProject;
  }
}
