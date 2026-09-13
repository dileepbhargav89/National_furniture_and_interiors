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
import { IEmailService, ISmsService, IWhatsAppService } from './ports';
import { NotificationEntity } from '../domain/notification';
import { notificationsQueue, invoicesQueue } from '../../../queues';

export class ProcessOutboxRelayUseCase {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService,
    private readonly smsService: ISmsService,
    private readonly whatsappService: IWhatsAppService
  ) {}

  async execute(): Promise<void> {
    const pendingEvents = await this.outboxRepository.findPending(50);

    for (const event of pendingEvents) {
      try {
        let title = 'System Notification';
        let message = 'You have a new notification.';
        let type = NotificationType.GENERAL;
        let priority = NotificationPriority.NORMAL;
        let recipientId: string | null = null;
        let channel = NotificationChannel.IN_APP;
        let actionUrl: string | undefined;
        let actionLabel: string | undefined;

        if (event.eventType === DomainEventType.LEAD_CREATED) {
          type = NotificationType.GENERAL;
          title = 'New Lead Received';
          message = `Lead ${event.aggregateId} has been created and requires triage.`;
          channel = NotificationChannel.EMAIL;
          priority = NotificationPriority.HIGH;
          actionUrl = `/crm?leadId=${event.aggregateId}`;
          actionLabel = 'Review Lead';
        } else if (event.eventType === DomainEventType.ORDER_PAID) {
          type = NotificationType.PAYMENT_RECEIVED;
          title = 'Payment Received — Order Confirmed';
          message = `Payment successfully processed for order ${event.aggregateId}. Artisanal production is being scheduled.`;
          channel = NotificationChannel.EMAIL;
          priority = NotificationPriority.HIGH;
          if (event.payload && typeof event.payload.userId === 'string') {
            recipientId = event.payload.userId;
          } else if (event.payload && typeof event.payload.customerEmail === 'string') {
            recipientId = event.payload.customerEmail;
          }
          actionUrl = `/orders/${event.aggregateId}`;
          actionLabel = 'Track Order';
        } else if (event.eventType === DomainEventType.PAYMENT_CAPTURED) {
          try {
            // Enqueue invoice generation job if invoicesQueue is available
            if (invoicesQueue && typeof invoicesQueue.add === 'function') {
              await invoicesQueue.add('generate-invoice', { paymentId: event.aggregateId });
            }
          } catch {
            // Ignore queue dispatch error in test environments
          }

          type = NotificationType.PAYMENT_RECEIVED;
          title = 'Payment Captured & Invoice Generated';
          message = `Payment ${event.aggregateId} captured successfully. Your official GST tax invoice is available.`;
          channel = NotificationChannel.IN_APP;
          priority = NotificationPriority.NORMAL;
          actionUrl = `/payments/${event.aggregateId}`;
          actionLabel = 'View Receipt';
        }

        const notificationParams: CreateNotificationParams = {
          recipientId,
          channel,
          type,
          priority,
          title,
          message,
          actionUrl,
          actionLabel,
          payload: event.payload,
        };

        const notification = NotificationEntity.create(notificationParams);
        const saved = await this.notificationRepository.create(notification);

        try {
          if (notificationsQueue && typeof notificationsQueue.add === 'function') {
            await notificationsQueue.add('send-notification', { notificationId: saved.id });
          }
        } catch {
          // In environments without Redis, send directly if needed
        }

        await this.outboxRepository.markProcessed(event.id);
      } catch (error: unknown) {
        // eslint-disable-next-line no-console
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
    private readonly whatsappService: IWhatsAppService
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
    private readonly whatsappService: IWhatsAppService
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
            { type: notification.type, payload: notification.payload }
          );
          break;
        case NotificationChannel.SMS:
          success = await this.smsService.sendSms(
            notification.recipientId ?? 'unknown',
            notification.message
          );
          break;
        case NotificationChannel.WHATSAPP:
          success = await this.whatsappService.sendWhatsAppMessage(
            notification.recipientId ?? 'unknown',
            notification.message
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
        await this.notificationRepository.markFailed(notification.id, 'Provider dispatch unsuccessful');
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
    private readonly sendNotificationByIdUseCase: SendNotificationByIdUseCase
  ) {}

  async execute(params: {
    channel: NotificationChannel;
    type: NotificationType;
    recipient: string;
    title?: string | undefined;
    message?: string | undefined;
  }): Promise<{ id: string; status: string; channel: NotificationChannel }> {
    const title = params.title || `Test ${params.channel} Notification`;
    const message = params.message || `This is a verified test dispatch for channel ${params.channel} from National Furniture & Interiors.`;

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
