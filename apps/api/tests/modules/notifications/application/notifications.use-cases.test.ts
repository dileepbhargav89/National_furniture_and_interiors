import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessOutboxRelayUseCase } from '../../../../src/modules/notifications/application/notifications.use-cases';
import { DomainEventType, OutboxStatus } from '../../../../src/core/events/domain-events';
import { NotificationChannel, NotificationType, NotificationStatus } from '../../../../src/modules/notifications/domain/notifications.types';
import { notificationsQueue } from '../../../../src/queues';

vi.mock('../../../../src/queues', () => ({
  notificationsQueue: {
    add: vi.fn(),
  },
}));

describe('ProcessOutboxRelayUseCase', () => {
  let useCase: ProcessOutboxRelayUseCase;
  let mockOutboxRepo: any;
  let mockNotificationRepo: any;

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

    useCase = new ProcessOutboxRelayUseCase(
      mockOutboxRepo,
      mockNotificationRepo,
      {} as any,
      {} as any,
      {} as any
    );
  });

  it('processes pending events and adds notifications to queue', async () => {
    const mockEvents = [
      {
        id: 'outbox-1',
        eventType: DomainEventType.LEAD_CREATED,
        aggregateType: 'Lead',
        aggregateId: 'lead-1',
        payload: { email: 'test@example.com' },
        status: OutboxStatus.PENDING,
      },
    ];

    mockOutboxRepo.findPending.mockResolvedValue(mockEvents);
    mockNotificationRepo.create.mockResolvedValue({ id: 'notif-1' });

    await useCase.execute();

    expect(mockOutboxRepo.findPending).toHaveBeenCalledWith(50);
    expect(mockNotificationRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: null,
      channel: NotificationChannel.EMAIL,
      type: NotificationType.GENERAL,
      title: 'New Lead Received',
      message: 'Lead lead-1 has been created and requires triage.',
      payload: { email: 'test@example.com' },
      status: NotificationStatus.PENDING,
      isRead: false,
    }));
    expect(notificationsQueue.add).toHaveBeenCalledWith('send-notification', { notificationId: 'notif-1' });
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
