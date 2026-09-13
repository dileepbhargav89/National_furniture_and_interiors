import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SendNotificationByIdUseCase,
  GetMyNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkAllAsReadUseCase,
  GetDeliveryStatsUseCase,
} from './notifications.use-cases';
import {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../domain/notifications.types';

describe('Notification Use Cases', () => {
  describe('SendNotificationByIdUseCase', () => {
    let mockNotificationRepository: any;
    let mockEmailAdapter: any;
    let mockSmsAdapter: any;
    let mockWhatsappAdapter: any;
    let useCase: SendNotificationByIdUseCase;

    beforeEach(() => {
      mockNotificationRepository = {
        findById: vi.fn(),
        markSent: vi.fn(),
        markFailed: vi.fn(),
      };
      mockEmailAdapter = { sendEmail: vi.fn() };
      mockSmsAdapter = { sendSms: vi.fn() };
      mockWhatsappAdapter = { sendWhatsAppMessage: vi.fn() };

      useCase = new SendNotificationByIdUseCase(
        mockNotificationRepository,
        mockEmailAdapter,
        mockSmsAdapter,
        mockWhatsappAdapter
      );
    });

    it('should successfully send an email notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        channel: NotificationChannel.EMAIL,
        type: NotificationType.GENERAL,
        priority: NotificationPriority.NORMAL,
        title: 'Test',
        message: 'Hello',
        status: NotificationStatus.PENDING,
      };
      mockNotificationRepository.findById.mockResolvedValue(mockNotification);
      mockEmailAdapter.sendEmail.mockResolvedValue(true);

      await useCase.execute('notif-1');

      expect(mockNotificationRepository.findById).toHaveBeenCalledWith('notif-1');
      expect(mockEmailAdapter.sendEmail).toHaveBeenCalledWith(
        'unknown@example.com',
        'Test',
        'Hello',
        expect.anything()
      );
      expect(mockNotificationRepository.markSent).toHaveBeenCalledWith('notif-1');
      expect(mockNotificationRepository.markFailed).not.toHaveBeenCalled();
    });

    it('should mark notification as failed if adapter throws', async () => {
      const mockNotification = {
        id: 'notif-1',
        channel: NotificationChannel.SMS,
        type: NotificationType.GENERAL,
        priority: NotificationPriority.NORMAL,
        title: 'Test',
        message: 'Hello',
        status: NotificationStatus.PENDING,
      };
      mockNotificationRepository.findById.mockResolvedValue(mockNotification);
      mockSmsAdapter.sendSms.mockRejectedValue(new Error('Gateway error'));

      await expect(useCase.execute('notif-1')).rejects.toThrow('Gateway error');

      expect(mockSmsAdapter.sendSms).toHaveBeenCalled();
      expect(mockNotificationRepository.markSent).not.toHaveBeenCalled();
      expect(mockNotificationRepository.markFailed).toHaveBeenCalledWith('notif-1', 'Gateway error');
    });

    it('should ignore if notification is already sent', async () => {
      const mockNotification = {
        id: 'notif-1',
        channel: NotificationChannel.EMAIL,
        type: NotificationType.GENERAL,
        priority: NotificationPriority.NORMAL,
        title: 'Test',
        message: 'Hello',
        status: NotificationStatus.SENT, // Already sent
      };
      mockNotificationRepository.findById.mockResolvedValue(mockNotification);

      await useCase.execute('notif-1');

      expect(mockEmailAdapter.sendEmail).not.toHaveBeenCalled();
      expect(mockNotificationRepository.markSent).not.toHaveBeenCalled();
    });

    it('should throw if notification is not found', async () => {
      mockNotificationRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow('Notification invalid-id not found');
    });
  });

  describe('GetMyNotificationsUseCase', () => {
    it('should retrieve notifications for specific recipient', async () => {
      const mockRepo = {
        findByRecipient: vi.fn().mockResolvedValue([{ id: 'n1', recipientId: 'user-1' }]),
      };
      const useCase = new GetMyNotificationsUseCase(mockRepo as any);
      const res = await useCase.execute('user-1', 10, 0);

      expect(mockRepo.findByRecipient).toHaveBeenCalledWith('user-1', 10, 0);
      expect(res).toHaveLength(1);
      expect(res[0]?.id).toBe('n1');
    });
  });

  describe('GetUnreadCountUseCase', () => {
    it('should return unread count for recipient', async () => {
      const mockRepo = {
        countUnread: vi.fn().mockResolvedValue(3),
      };
      const useCase = new GetUnreadCountUseCase(mockRepo as any);
      const count = await useCase.execute('user-1');

      expect(mockRepo.countUnread).toHaveBeenCalledWith('user-1');
      expect(count).toBe(3);
    });
  });

  describe('MarkAllAsReadUseCase', () => {
    it('should mark all in-app notifications as read for recipient', async () => {
      const mockRepo = {
        markAllAsRead: vi.fn().mockResolvedValue(5),
      };
      const useCase = new MarkAllAsReadUseCase(mockRepo as any);
      const modified = await useCase.execute('user-1');

      expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(modified).toBe(5);
    });
  });

  describe('GetDeliveryStatsUseCase', () => {
    it('should return aggregated delivery stats', async () => {
      const mockStats = {
        total: 10,
        sent: 8,
        failed: 1,
        pending: 1,
        unreadInApp: 2,
        byChannel: {
          EMAIL: 4,
          WHATSAPP: 3,
          SMS: 1,
          IN_APP: 2,
          PUSH: 0,
        },
      };
      const mockRepo = {
        getStats: vi.fn().mockResolvedValue(mockStats),
      };
      const useCase = new GetDeliveryStatsUseCase(mockRepo as any);
      const res = await useCase.execute();

      expect(mockRepo.getStats).toHaveBeenCalled();
      expect(res.total).toBe(10);
      expect(res.sent).toBe(8);
    });
  });
});
