import { NotFoundError, ValidationError, ConflictError } from '../../../core/exceptions';
import type {
  Lead,
  LeadPriority,
  LeadStatus,
  LeadSource,
  LeadInterestType,
} from '../domain/leads.types';
import type { ILeadRepository, CreateLeadInput, ListLeadsFilters } from './ports';
import { IOutboxRepository } from '../../../core/events/outbox.repository';
import { DomainEventType } from '../../../core/events/domain-events';
import type { CustomerRepository } from '../../crm/application/ports';
import { NotificationEventHub } from '../../notifications/infrastructure/services/notification-event-hub';

export interface SubmitLeadRequest {
  source: LeadSource;
  sourceDetail?:
    | {
        utmSource?: string | undefined;
        utmMedium?: string | undefined;
        utmCampaign?: string | undefined;
      }
    | undefined;
  name: string;
  email?: string | undefined;
  phone: string;
  interestType: LeadInterestType;
  projectType?: Lead['projectType'] | undefined;
  budgetRange?: { min: number; max: number } | undefined;
  timeline?: Lead['timeline'] | undefined;
  consultationBooking?: Lead['consultationBooking'] | undefined;
  swatchKitOrder?: Lead['swatchKitOrder'] | undefined;
  marketingConsent: {
    granted: boolean;
    source?: string | undefined;
    channels: Array<'SMS' | 'WHATSAPP' | 'EMAIL'>;
  };
  captchaToken: string;
}

export class SubmitLeadUseCase {
  constructor(
    private readonly leadsRepo: ILeadRepository,
    private readonly outboxRepo: IOutboxRepository,
    private readonly customerRepo?: CustomerRepository,
  ) {}

  async execute(request: SubmitLeadRequest): Promise<Lead> {
    // 1. CAPTCHA verification (mocked)
    if (!request.captchaToken || request.captchaToken === 'invalid') {
      throw new ValidationError('Invalid CAPTCHA token');
    }

    // 2. Validate marketing consent
    if (request.marketingConsent.granted && request.marketingConsent.channels.length === 0) {
      throw new ValidationError('Marketing consent granted but no channels specified');
    }

    // 3. Compute score and priority
    let score = 0;
    if (request.interestType === 'INTERIOR_DESIGN') score += 50;
    else if (request.interestType === 'FURNITURE_PURCHASE') score += 20;
    else if (request.interestType === 'BOTH') score += 70;

    if (request.projectType) score += 20;
    if (request.budgetRange) score += 30;
    if (request.timeline === 'IMMEDIATE') score += 20;
    if (request.consultationBooking) score += 30;
    if (request.swatchKitOrder) score += 35;

    let priority: LeadPriority = 'COLD';
    if (request.consultationBooking || request.swatchKitOrder || score >= 80) priority = 'HOT';
    else if (score >= 40) priority = 'WARM';

    // 4. Create lead
    const input: CreateLeadInput = {
      source: request.source,
      ...(request.sourceDetail ? { sourceDetail: request.sourceDetail } : {}),
      name: request.name,
      ...(request.email ? { email: request.email } : {}),
      phone: request.phone,
      interestType: request.interestType,
      ...(request.projectType ? { projectType: request.projectType } : {}),
      ...(request.budgetRange ? { budgetRange: request.budgetRange } : {}),
      ...(request.timeline ? { timeline: request.timeline } : {}),
      ...(request.consultationBooking ? { consultationBooking: request.consultationBooking } : {}),
      ...(request.swatchKitOrder ? { swatchKitOrder: request.swatchKitOrder } : {}),
      marketingConsent: {
        granted: request.marketingConsent.granted,
        ...(request.marketingConsent.granted ? { grantedAt: new Date() } : {}),
        ...(request.marketingConsent.source ? { source: request.marketingConsent.source } : {}),
        channels: request.marketingConsent.channels,
      },
      score,
      priority,
      status: request.consultationBooking ? 'CONSULTATION_SCHEDULED' : 'NEW',
    };

    const lead = await this.leadsRepo.create(input);

    await this.outboxRepo.append({
      eventType: DomainEventType.LEAD_CREATED,
      aggregateType: 'Lead',
      aggregateId: lead.id,
      payload: lead,
    });

    // 5. Automatically create/sync into CRM Customer Pipeline
    if (this.customerRepo) {
      try {
        const cleanPhone = request.phone.replace(/[^0-9]/g, '');
        const fallbackEmail =
          request.email || `lead-${cleanPhone || Date.now()}@inquiry.nationalinteriors.in`;
        const budgetMax = request.budgetRange?.max ? request.budgetRange.max * 100 : 25000000;
        const preferredStudio =
          request.consultationBooking?.studioLocation &&
          ['INDIRANAGAR', 'WHITEFIELD', 'HSR_LAYOUT', 'VIRTUAL'].includes(
            request.consultationBooking.studioLocation,
          )
            ? (request.consultationBooking.studioLocation as
                'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIRTUAL')
            : 'INDIRANAGAR';

        const bookingNote = request.consultationBooking
          ? ` [Scheduled: ${request.consultationBooking.consultationType} at ${request.consultationBooking.studioLocation || 'Studio'} on ${request.consultationBooking.scheduledDate} @ ${request.consultationBooking.timeSlot}]`
          : '';

        const swatchNote = request.swatchKitOrder
          ? ` [Swatch Kit: ${request.swatchKitOrder.kitType} to ${request.swatchKitOrder.deliveryAddress.city} (${request.swatchKitOrder.deliveryAddress.pincode})]`
          : '';

        await this.customerRepo.save({
          customerCode: `NFI-LEAD-${Date.now().toString().slice(-6)}`,
          name: request.name,
          email: fallbackEmail,
          phone: request.phone,
          tags: [
            'STOREFRONT_LEAD',
            request.interestType,
            ...(request.consultationBooking ? ['CONSULTATION_BOOKED'] : []),
            ...(request.swatchKitOrder ? ['SWATCH_KIT_ORDER', request.swatchKitOrder.kitType] : []),
          ],
          clientTier:
            score >= 80 || request.consultationBooking || request.swatchKitOrder
              ? 'HIGH_NET_WORTH'
              : 'PROSPECT',
          preferredStudio,
          ...(request.consultationBooking
            ? { consultationBooking: request.consultationBooking }
            : {}),
          ...(request.swatchKitOrder ? { swatchKitOrder: request.swatchKitOrder } : {}),
          propertyDetails: {
            community:
              (request.sourceDetail?.utmCampaign as string) ||
              request.projectType ||
              'Bengaluru Prime',
            configuration:
              request.interestType === 'INTERIOR_DESIGN'
                ? 'Full Home Interiors'
                : 'Bespoke Furnishings',
          },
          estimatedDealValue: budgetMax,
          currentPipelineStage: request.consultationBooking ? 'STUDIO_CONSULTATION' : 'NEW_INQUIRY',
          acquisitionSource: request.source || 'WEBSITE_FORM',
          notes: `Interest: ${request.interestType}. Priority: ${priority} (Score: ${score}). Timeline: ${request.timeline || 'Flexible'}.${bookingNote}${swatchNote}`,
          lifetimeValue: 0,
          totalOrders: 0,
          totalDesignProjects: 0,
        });
      } catch (crmErr) {
        // Log gracefully so storefront lead submission always succeeds
        console.warn('[SubmitLeadUseCase] Auto-sync to CRM customer skipped:', crmErr);
      }
    }

    // 6. Real-Time Push Notification to Admin Staff via NotificationEventHub
    try {
      const isHighValue = (request.budgetRange?.max ?? 0) >= 2500000 || priority === 'HOT';
      const eventHub = NotificationEventHub.getInstance();
      eventHub.broadcastToStaff('notification', {
        id: `lead-alert-${lead.id}`,
        type: request.consultationBooking
          ? 'CONSULTATION_BOOKED'
          : request.swatchKitOrder
            ? 'SWATCH_KIT_ORDERED'
            : 'LEAD_CONCIERGE_ALERT',
        title: request.consultationBooking
          ? `VIP Consultation Scheduled: ${request.name}`
          : request.swatchKitOrder
            ? `Luxury Swatch Kit Ordered: ${request.name}`
            : `Incoming Lead Concierge Alert: ${request.name}`,
        message: request.consultationBooking
          ? `${request.consultationBooking.consultationType} on ${request.consultationBooking.scheduledDate} (${request.consultationBooking.timeSlot})`
          : request.swatchKitOrder
            ? `${request.swatchKitOrder.kitType} Kit to ${request.swatchKitOrder.deliveryAddress.city}`
            : `Interest: ${request.interestType} • Priority: ${priority} • Score: ${score}`,
        priority: isHighValue ? 'URGENT' : 'HIGH',
        channel: 'IN_APP',
        actionUrl: '/crm',
        actionLabel: 'View in CRM',
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Safe fallback if SSE hub is not initialized
    }

    return lead;
  }
}

export class ListLeadsUseCase {
  constructor(private readonly leadsRepo: ILeadRepository) {}

  async execute(filters: ListLeadsFilters, limit: number = 20, offset: number = 0) {
    return this.leadsRepo.find(filters, limit, offset);
  }
}

export class AssignLeadUseCase {
  constructor(private readonly leadsRepo: ILeadRepository) {}

  async execute(leadId: string, assignedToId: string, expectedVersion: number): Promise<Lead> {
    const lead = await this.leadsRepo.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    // Attempt atomic update
    const updatedLead = await this.leadsRepo.update(leadId, { assignedToId }, expectedVersion);

    if (!updatedLead) {
      throw new ConflictError('Concurrent modification detected or lead deleted');
    }

    return updatedLead;
  }
}

export class UpdateLeadStatusUseCase {
  constructor(private readonly leadsRepo: ILeadRepository) {}

  async execute(leadId: string, status: LeadStatus, expectedVersion: number): Promise<Lead> {
    const lead = await this.leadsRepo.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    if (status === 'CONTACTED' && !lead.assignedToId) {
      throw new ValidationError('Lead must be assigned before it can be marked as CONTACTED');
    }

    const updatedLead = await this.leadsRepo.update(leadId, { status }, expectedVersion);

    if (!updatedLead) {
      throw new ConflictError('Concurrent modification detected or lead deleted');
    }

    return updatedLead;
  }
}

export class GetLeadsFunnelUseCase {
  constructor(private readonly leadsRepo: ILeadRepository) {}

  async execute(startDate?: string, endDate?: string) {
    const metrics = await this.leadsRepo.getFunnelMetrics(startDate, endDate);
    const conversionRate =
      metrics.totalLeads > 0 ? (metrics.convertedLeads / metrics.totalLeads) * 100 : 0;

    return {
      ...metrics,
      conversionRate,
    };
  }
}
