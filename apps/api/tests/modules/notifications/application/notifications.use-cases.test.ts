import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOutboxRelayUseCase } from '../../../../src/modules/notifications/application/notifications.use-cases';
import { DomainEventType, OutboxStatus } from '../../../../src/core/events/domain-events';
import {
  NotificationChannel,
  NotificationType,
} from '../../../../src/modules/notifications/domain/notifications.types';
import type { IOutboxRepository } from '../../../../src/core/events/outbox.repository';
import type { INotificationRepository } from '../../../../src/modules/notifications/domain/notifications.types';
import type {
  IEmailService,
  ISmsService,
  IWhatsAppService,
} from '../../../../src/modules/notifications/application/ports';
import { notificationsQueue } from '../../../../src/queues';

vi.mock('../../../../src/queues', () => ({
  notificationsQueue: {
    add: vi.fn(),
  },
}));

describe('ProcessOutboxRelayUseCase', () => {
  let useCase: ProcessOutboxRelayUseCase;
  let mockOutboxRepo: {
    findPending: ReturnType<typeof vi.fn>;
    markProcessed: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
  };
  let mockNotificationRepo: {
    create: ReturnType<typeof vi.fn>;
    markSent: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
  };
  let mockEmailService: {
    sendEmail: ReturnType<typeof vi.fn>;
  };
  let mockSmsService: {
    sendSms: ReturnType<typeof vi.fn>;
  };
  let mockWhatsappService: {
    sendWhatsAppMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOutboxRepo = {
      findPending: vi.fn(),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
    };

    mockNotificationRepo = {
      create: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
    };

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue({ id: 'email-1' }),
    };

    mockSmsService = {
      sendSms: vi.fn().mockResolvedValue({ id: 'sms-1' }),
    };

    mockWhatsappService = {
      sendWhatsAppMessage: vi.fn().mockResolvedValue({ id: 'wa-1' }),
    };

    useCase = new ProcessOutboxRelayUseCase(
      mockOutboxRepo as unknown as IOutboxRepository,
      mockNotificationRepo as unknown as INotificationRepository,
      mockEmailService as unknown as IEmailService,
      mockSmsService as unknown as ISmsService,
      mockWhatsappService as unknown as IWhatsAppService,
    );
  });

  it('processes pending events and adds notifications to queue', async () => {
    const mockEvents = [
      {
        id: 'outbox-1',
        eventType: DomainEventType.LEAD_CREATED,
        aggregateType: 'Lead',
        aggregateId: 'lead-1',
        payload: { email: 'test@example.com', name: 'John Doe', priority: 'HOT' },
        status: OutboxStatus.PENDING,
      },
    ];

    mockOutboxRepo.findPending.mockResolvedValue(mockEvents);
    mockNotificationRepo.create.mockResolvedValue({ id: 'notif-1' });

    await useCase.execute();

    expect(mockOutboxRepo.findPending).toHaveBeenCalledWith(50);
    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: null,
        channel: NotificationChannel.IN_APP,
        type: NotificationType.LEAD_CONCIERGE_ALERT,
        title: 'New [HOT] Inquiry: John Doe',
      }),
    );
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(2);
    expect(mockOutboxRepo.markProcessed).toHaveBeenCalledWith('outbox-1');
  });

  it('marks outbox event as failed on error', async () => {
    const mockEvents = [
      {
        id: 'outbox-2',
        eventType: DomainEventType.LEAD_CREATED,
        aggregateType: 'Lead',
        aggregateId: 'lead-1',
        payload: {},
        status: OutboxStatus.PENDING,
      },
    ];

    mockOutboxRepo.findPending.mockResolvedValue(mockEvents);
    mockNotificationRepo.create.mockRejectedValue(new Error('DB Error'));

    await useCase.execute();

    expect(notificationsQueue.add).not.toHaveBeenCalled();
    expect(mockOutboxRepo.markFailed).toHaveBeenCalledWith('outbox-2', 'DB Error');
  });
});
