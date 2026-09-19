import { IOutboxRepository } from '../../../core/events/outbox.repository';
import { DomainEventType } from '../../../core/events/domain-events';
import {
  INotificationRepository,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  CreateNotificationParams,
  NotificationStats,
} from '../domain/notifications.types';
import { EmailAttachment, IEmailService, ISmsService, IWhatsAppService } from './ports';
import { NotificationEntity } from '../domain/notification';
import { notificationsQueue, invoicesQueue } from '../../../queues';

export interface IInvoicePdfProvider {
  generatePdfForOrder(orderId: string): Promise<{ buffer: Buffer; filename: string }>;
}

export class ProcessOutboxRelayUseCase {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly smsService: ISmsService,
    private readonly whatsappService: IWhatsAppService,
    private readonly invoicePdfProvider?: IInvoicePdfProvider,
  ) {}

  async execute(): Promise<void> {
    const pendingEvents = await this.outboxRepository.findPending(50);

    for (const event of pendingEvents) {
      try {
        const payload = (event.payload || {}) as Record<string, unknown>;

        if (event.eventType === DomainEventType.LEAD_CREATED) {
          // 1. Dual-Routing: Route A - Patron Welcome Email
          const clientEmail = typeof payload.email === 'string' ? payload.email : null;
          if (clientEmail) {
            await this.emailService.sendEmail(
              clientEmail,
              'Welcome to National Furniture & Interiors — Consultation Initiated',
              'Thank you for consulting with National Interiors. Your dedicated design team is reviewing your requirements.',
              {
                type: NotificationType.LEAD_CUSTOMER_WELCOME,
                payload: {
                  clientName: payload.name || 'Patron',
                  requirementType: payload.interestType,
                  phone: payload.phone,
                },
              },
            );
          }

          // Route B - Internal Concierge / Sales Alert (In-App & Email)
          const priority =
            payload.priority === 'HOT' ? NotificationPriority.URGENT : NotificationPriority.HIGH;
          const leadTitle = `New [${payload.priority || 'LEAD'}] Inquiry: ${payload.name || 'Client'}`;
          const leadMessage = `Requirement: ${payload.interestType || 'Interior Design'}. Phone: ${payload.phone || 'N/A'}. Score: ${payload.score || 0} pts.`;

          await this.notificationRepository.create({
            recipientId: null, // broadcast to administrative CRM dashboard
            channel: NotificationChannel.IN_APP,
            type: NotificationType.LEAD_CONCIERGE_ALERT,
            priority,
            title: leadTitle,
            message: leadMessage,
            actionUrl: `/crm?leadId=${event.aggregateId}`,
            actionLabel: 'Review Lead',
            payload,
          });

          await this.emailService.sendEmail(
            'concierge@nationalinteriors.in',
            `[Lead Alert - ${payload.priority || 'INQUIRY'}] ${payload.name || 'Client'} (${payload.interestType || 'Design'})`,
            leadMessage,
            {
              type: NotificationType.LEAD_CONCIERGE_ALERT,
              payload: {
                leadId: event.aggregateId,
                name: payload.name || 'Prospective Client',
                phone: payload.phone || '',
                email: clientEmail || undefined,
                interestType: payload.interestType || 'INTERIOR_DESIGN',
                projectType: payload.projectType,
                budgetRange: payload.budgetRange,
                timeline: payload.timeline,
                priority: payload.priority || 'WARM',
                score: payload.score || 50,
                actionUrl: `/crm?leadId=${event.aggregateId}`,
              },
            },
          );
        } else if (event.eventType === DomainEventType.ORDER_PAID) {
          // 1. Generate Form GST INV-1 PDF Attachment
          let attachments: EmailAttachment[] | undefined;
          if (this.invoicePdfProvider) {
            try {
              const inv = await this.invoicePdfProvider.generatePdfForOrder(event.aggregateId);
              attachments = [
                {
                  filename: inv.filename,
                  content: inv.buffer,
                  contentType: 'application/pdf',
                },
              ];
            } catch (invErr) {
              console.error(
                `[ProcessOutboxRelay] PDF Invoice generation failed for order ${event.aggregateId}:`,
                invErr,
              );
            }
          }

          // 2. Dispatch Order Confirmation Email with Attached PDF Invoice
          const customerEmail =
            typeof payload.customerEmail === 'string'
              ? payload.customerEmail
              : typeof payload.userId === 'string' && payload.userId.includes('@')
                ? payload.userId
                : null;

          if (customerEmail) {
            await this.emailService.sendEmail(
              customerEmail,
              `Order Confirmed: ${payload.orderNumber || event.aggregateId} — National Furniture & Interiors`,
              `Thank you for your acquisition. Your order is confirmed and official tax invoice is attached.`,
              {
                type: NotificationType.ORDER_CONFIRMED,
                payload: {
                  orderId: payload.orderNumber || event.aggregateId,
                  customerName: payload.customerName || 'Valued Patron',
                  totalAmount: payload.totalAmount || payload.amount || 0,
                  items: payload.items,
                  deliveryAddress: payload.deliveryAddress,
                  actionUrl: `https://nationalinteriors.in/orders/${event.aggregateId}`,
                },
                attachments,
              },
            );
          }

          // 3. Create In-App Notification for Customer
          const userRecipient = typeof payload.userId === 'string' ? payload.userId : null;
          await this.notificationRepository.create({
            recipientId: userRecipient,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.ORDER_CONFIRMED,
            priority: NotificationPriority.HIGH,
            title: 'Order Confirmed — Invoice Available',
            message: `Payment received for order #${payload.orderNumber || event.aggregateId}. Artisanal crafting has commenced.`,
            actionUrl: `/orders/${event.aggregateId}`,
            actionLabel: 'Track Order',
            payload,
          });
        } else if (event.eventType === DomainEventType.ORDER_MILESTONE_ADVANCE_PAID) {
          // 50% Milestone Advance Paid
          let attachments: EmailAttachment[] | undefined;
          if (this.invoicePdfProvider) {
            try {
              const inv = await this.invoicePdfProvider.generatePdfForOrder(event.aggregateId);
              attachments = [
                {
                  filename: inv.filename,
                  content: inv.buffer,
                  contentType: 'application/pdf',
                },
              ];
            } catch (invErr) {
              console.error(
                `[ProcessOutboxRelay] PDF Advance Invoice failed for order ${event.aggregateId}:`,
                invErr,
              );
            }
          }

          const customerEmail =
            typeof payload.customerEmail === 'string'
              ? payload.customerEmail
              : typeof payload.userId === 'string' && payload.userId.includes('@')
                ? payload.userId
                : null;

          if (customerEmail) {
            await this.emailService.sendEmail(
              customerEmail,
              `Bespoke Order Confirmed: 50% Advance Received — Order #${payload.orderNumber || event.aggregateId}`,
              `50% advance received for bespoke order ${payload.orderNumber || event.aggregateId}. Material procurement initiated.`,
              {
                type: NotificationType.ORDER_ADVANCE_CONFIRMED,
                payload: {
                  orderId: payload.orderNumber || event.aggregateId,
                  customerName: payload.customerName || 'Valued Patron',
                  advanceAmount: payload.advanceAmount || payload.amount || 0,
                  balanceAmount: payload.balanceAmount || 0,
                  totalAmount: payload.totalAmount || 0,
                  items: payload.items,
                  deliveryAddress: payload.deliveryAddress,
                  actionUrl: `https://nationalinteriors.in/orders/${event.aggregateId}`,
                },
                attachments,
              },
            );
          }

          const userRecipient = typeof payload.userId === 'string' ? payload.userId : null;
          await this.notificationRepository.create({
            recipientId: userRecipient,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.ORDER_ADVANCE_CONFIRMED,
            priority: NotificationPriority.HIGH,
            title: '50% Advance Confirmed — Bespoke Crafting Commenced',
            message: `Advance deposit received for order #${payload.orderNumber || event.aggregateId}. Balance payable prior to dispatch.`,
            actionUrl: `/orders/${event.aggregateId}`,
            actionLabel: 'View Schedule',
            payload,
          });
        } else if (event.eventType === DomainEventType.ORDER_MILESTONE_BALANCE_DUE) {
          // Crafting complete, 50% balance reminder
          const customerEmail =
            typeof payload.customerEmail === 'string'
              ? payload.customerEmail
              : typeof payload.userId === 'string' && payload.userId.includes('@')
                ? payload.userId
                : null;

          if (customerEmail) {
            await this.emailService.sendEmail(
              customerEmail,
              `Artisanal Crafting Complete: Balance Due for Order #${payload.orderNumber || event.aggregateId}`,
              `Your bespoke furniture pieces are crafted. Complete the remaining 50% balance to schedule white-glove delivery.`,
              {
                type: NotificationType.MILESTONE_BALANCE_DUE,
                payload: {
                  orderId: payload.orderNumber || event.aggregateId,
                  customerName: payload.customerName || 'Valued Patron',
                  balanceAmount: payload.balanceAmount || 0,
                  totalAmount: payload.totalAmount || 0,
                  items: payload.items,
                  actionUrl:
                    (payload.actionUrl as string) ||
                    `https://nationalinteriors.in/orders/${event.aggregateId}`,
                },
              },
            );
          }

          const userRecipient = typeof payload.userId === 'string' ? payload.userId : null;
          await this.notificationRepository.create({
            recipientId: userRecipient,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.MILESTONE_BALANCE_DUE,
            priority: NotificationPriority.URGENT,
            title: 'Action Required: Settle Final 50% Balance',
            message: `Artisan crafting for order #${payload.orderNumber || event.aggregateId} is complete. Settle remaining balance to dispatch delivery.`,
            actionUrl: `/orders/${event.aggregateId}`,
            actionLabel: 'Settle Balance',
            payload,
          });
        } else if (event.eventType === DomainEventType.ORDER_FULFILLMENT_UPDATED) {
          const userRecipient = typeof payload.userId === 'string' ? payload.userId : null;
          await this.notificationRepository.create({
            recipientId: userRecipient,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.ORDER_IN_PRODUCTION,
            priority: NotificationPriority.NORMAL,
            title: `Order #${payload.orderNumber || event.aggregateId} Status: ${payload.status}`,
            message: payload.note
              ? `Update: ${payload.note}`
              : `Fulfillment status changed to ${payload.status}.`,
            actionUrl: `/orders/${event.aggregateId}`,
            actionLabel: 'Track Order',
            payload,
          });
        } else if (event.eventType === DomainEventType.ORDER_CREATED) {
          const userRecipient = typeof payload.userId === 'string' ? payload.userId : null;
          await this.notificationRepository.create({
            recipientId: userRecipient,
            channel: NotificationChannel.IN_APP,
            type: NotificationType.GENERAL,
            priority: NotificationPriority.NORMAL,
            title: `Order #${payload.orderNumber || event.aggregateId} Created`,
            message: `Your order has been registered and is awaiting settlement.`,
            actionUrl: `/orders/${event.aggregateId}`,
            actionLabel: 'View Order',
            payload,
          });
        } else if (event.eventType === DomainEventType.PAYMENT_CAPTURED) {
          try {
            if (invoicesQueue && typeof invoicesQueue.add === 'function') {
              await invoicesQueue.add('generate-invoice', { paymentId: event.aggregateId });
            }
          } catch {
            // ignore queue error
          }
        }

        await this.outboxRepository.markProcessed(event.id);
      } catch (error: unknown) {
        console.error(`Failed to process outbox event ${event.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.outboxRepository.markFailed(event.id, errorMessage);
      }
    }
  }
}

export class CreateAndSendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly smsService: ISmsService,
    private readonly whatsappService: IWhatsAppService,
  ) {}

  async execute(params: CreateNotificationParams): Promise<NotificationEntity> {
    const notification = NotificationEntity.create(params);
    const saved = await this.notificationRepository.create(notification);
    const entity = NotificationEntity.reconstruct(saved);

    // If queue is active, dispatch via queue; else if synchronous delivery needed, can send immediately
    try {
      if (notificationsQueue && typeof notificationsQueue.add === 'function') {
        await notificationsQueue.add('send-notification', { notificationId: saved.id });
      }
    } catch {
      // In offline or testing mode, ignore queue dispatch failure
    }

    return entity;
  }
}

export class ListNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(limit: number, offset: number, userId?: string) {
    return this.notificationRepository.findAll(limit, offset, userId);
  }
}

export class GetMyNotificationsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(recipientId: string, limit: number = 20, offset: number = 0) {
    return this.notificationRepository.findByRecipient(recipientId, limit, offset);
  }
}

export class GetUnreadCountUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(recipientId?: string): Promise<number> {
    return this.notificationRepository.countUnread(recipientId);
  }
}

export class MarkNotificationAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(notificationId: string): Promise<void> {
    await this.notificationRepository.markAsRead(notificationId);
  }
}

export class MarkAllAsReadUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(recipientId: string): Promise<number> {
    return this.notificationRepository.markAllAsRead(recipientId);
  }
}

export class SendNotificationByIdUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly smsService: ISmsService,
    private readonly whatsappService: IWhatsAppService,
  ) {}

  async execute(notificationId: string): Promise<void> {
    const doc = await this.notificationRepository.findById(notificationId);
    if (!doc) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const notification = NotificationEntity.reconstruct(doc);

    if (notification.status === NotificationStatus.SENT) {
      return;
    }

    try {
      let success = false;
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          success = await this.emailService.sendEmail(
            notification.recipientId ?? 'unknown@example.com',
            notification.title,
            notification.message,
            { type: notification.type, payload: notification.payload },
          );
          break;
        case NotificationChannel.SMS:
          success = await this.smsService.sendSms(
            notification.recipientId ?? 'unknown',
            notification.message,
          );
          break;
        case NotificationChannel.WHATSAPP:
          success = await this.whatsappService.sendWhatsAppMessage(
            notification.recipientId ?? 'unknown',
            notification.message,
          );
          break;
        case NotificationChannel.IN_APP:
          success = true;
          break;
        default:
          success = true;
          break;
      }

      if (success) {
        await this.notificationRepository.markSent(notification.id);
      } else {
        await this.notificationRepository.markFailed(
          notification.id,
          'Provider dispatch unsuccessful',
        );
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Dispatch error';
      await this.notificationRepository.markFailed(notification.id, errorMessage);
      throw error;
    }
  }
}

export class SendTestNotificationUseCase {
  constructor(
    private readonly createAndSendUseCase: CreateAndSendNotificationUseCase,
    private readonly sendNotificationByIdUseCase: SendNotificationByIdUseCase,
  ) {}

  async execute(params: {
    channel: NotificationChannel;
    type: NotificationType;
    recipient: string;
    title?: string | undefined;
    message?: string | undefined;
  }): Promise<{ id: string; status: string; channel: NotificationChannel }> {
    const title = params.title || `Test ${params.channel} Notification`;
    const message =
      params.message ||
      `This is a verified test dispatch for channel ${params.channel} from National Furniture & Interiors.`;

    const entity = await this.createAndSendUseCase.execute({
      recipientId: params.recipient,
      channel: params.channel,
      type: params.type,
      priority: NotificationPriority.HIGH,
      title,
      message,
      actionUrl: params.channel === NotificationChannel.IN_APP ? '/orders' : undefined,
      actionLabel: params.channel === NotificationChannel.IN_APP ? 'View Orders' : undefined,
      payload: {
        isTest: true,
        dispatchedAt: new Date().toISOString(),
      },
    });

    // Directly trigger delivery check
    await this.sendNotificationByIdUseCase.execute(entity.id);

    return {
      id: entity.id,
      status: 'DISPATCHED',
      channel: params.channel,
    };
  }
}

export class GetDeliveryStatsUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(): Promise<NotificationStats> {
    return this.notificationRepository.getStats();
  }
}
