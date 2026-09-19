import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProcessOutboxRelayUseCase,
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
  type INotificationRepository,
} from '../domain/notifications.types';
import type { IEmailService, ISmsService, IWhatsAppService } from './ports';
import type { IOutboxRepository } from '../../../core/events/outbox.repository';
import type { IInvoicePdfProvider } from './notifications.use-cases';
import { DomainEventType } from '../../../core/events/domain-events';

describe('Notification Use Cases', () => {
  describe('SendNotificationByIdUseCase', () => {
    let mockNotificationRepository: {
      findById: ReturnType<typeof vi.fn>;
      markSent: ReturnType<typeof vi.fn>;
      markFailed: ReturnType<typeof vi.fn>;
    };
    let mockEmailAdapter: { sendEmail: ReturnType<typeof vi.fn> };
    let mockSmsAdapter: { sendSms: ReturnType<typeof vi.fn> };
    let mockWhatsappAdapter: { sendWhatsAppMessage: ReturnType<typeof vi.fn> };
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
        mockNotificationRepository as unknown as INotificationRepository,
        mockEmailAdapter as unknown as IEmailService,
        mockSmsAdapter as unknown as ISmsService,
        mockWhatsappAdapter as unknown as IWhatsAppService,
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
        expect.anything(),
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
      expect(mockNotificationRepository.markFailed).toHaveBeenCalledWith(
        'notif-1',
        'Gateway error',
      );
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

      await expect(useCase.execute('invalid-id')).rejects.toThrow(
        'Notification invalid-id not found',
      );
    });
  });

  describe('GetMyNotificationsUseCase', () => {
    it('should retrieve notifications for specific recipient', async () => {
      const mockRepo = {
        findByRecipient: vi.fn().mockResolvedValue([{ id: 'n1', recipientId: 'user-1' }]),
      };
      const useCase = new GetMyNotificationsUseCase(mockRepo as unknown as INotificationRepository);
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
      const useCase = new GetUnreadCountUseCase(mockRepo as unknown as INotificationRepository);
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
      const useCase = new MarkAllAsReadUseCase(mockRepo as unknown as INotificationRepository);
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
      const useCase = new GetDeliveryStatsUseCase(mockRepo as unknown as INotificationRepository);
      const res = await useCase.execute();

      expect(mockRepo.getStats).toHaveBeenCalled();
      expect(res.total).toBe(10);
      expect(res.sent).toBe(8);
    });
  });

  describe('ProcessOutboxRelayUseCase (End-to-End Notification Flows)', () => {
    let mockOutboxRepository: {
      findPending: ReturnType<typeof vi.fn>;
      markProcessed: ReturnType<typeof vi.fn>;
      markFailed: ReturnType<typeof vi.fn>;
    };
    let mockNotificationRepository: {
      create: ReturnType<typeof vi.fn>;
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
    let mockInvoicePdfProvider: {
      generatePdfForOrder: ReturnType<typeof vi.fn>;
    };
    let useCase: ProcessOutboxRelayUseCase;

    beforeEach(() => {
      mockOutboxRepository = {
        findPending: vi.fn(),
        markProcessed: vi.fn(),
        markFailed: vi.fn(),
      };
      mockNotificationRepository = {
        create: vi.fn().mockResolvedValue({ id: 'notif-saved' }),
      };
      mockEmailService = {
        sendEmail: vi.fn().mockResolvedValue(true),
      };
      mockSmsService = { sendSms: vi.fn().mockResolvedValue(true) };
      mockWhatsappService = { sendWhatsAppMessage: vi.fn().mockResolvedValue(true) };
      mockInvoicePdfProvider = {
        generatePdfForOrder: vi.fn().mockResolvedValue({
          buffer: Buffer.from('mock-gst-pdf'),
          filename: 'NFI-INV-2026-001.pdf',
        }),
      };

      useCase = new ProcessOutboxRelayUseCase(
        mockOutboxRepository as unknown as IOutboxRepository,
        mockNotificationRepository as unknown as INotificationRepository,
        mockEmailService as unknown as IEmailService,
        mockSmsService as unknown as ISmsService,
        mockWhatsappService as unknown as IWhatsAppService,
        mockInvoicePdfProvider as unknown as IInvoicePdfProvider,
      );
    });

    it('Case 1: should dual-route customer inquiry to patron welcome email and concierge alert', async () => {
      mockOutboxRepository.findPending.mockResolvedValue([
        {
          id: 'event-lead-1',
          eventType: DomainEventType.LEAD_CREATED,
          aggregateId: 'lead-123',
          payload: {
            name: 'Ananya Rao',
            email: 'ananya@example.com',
            phone: '+91 98765 43210',
            interestType: 'INTERIOR_DESIGN',
            priority: 'HOT',
            score: 85,
          },
        },
      ]);

      await useCase.execute();

      // Patron welcome email
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'ananya@example.com',
        expect.stringContaining('Consultation Initiated'),
        expect.anything(),
        expect.objectContaining({ type: NotificationType.LEAD_CUSTOMER_WELCOME }),
      );

      // Concierge internal email
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'concierge@nationalinteriors.in',
        expect.stringContaining('[Lead Alert - HOT]'),
        expect.anything(),
        expect.objectContaining({ type: NotificationType.LEAD_CONCIERGE_ALERT }),
      );

      // In-app alert created
      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.LEAD_CONCIERGE_ALERT,
          priority: NotificationPriority.URGENT,
        }),
      );

      expect(mockOutboxRepository.markProcessed).toHaveBeenCalledWith('event-lead-1');
    });

    it('Case 2: should send order confirmation with Form GST INV-1 PDF attachment on ORDER_PAID', async () => {
      mockOutboxRepository.findPending.mockResolvedValue([
        {
          id: 'event-order-1',
          eventType: DomainEventType.ORDER_PAID,
          aggregateId: 'order-999',
          payload: {
            orderNumber: 'NFI-ORD-999',
            userId: 'user-patron-1',
            customerEmail: 'patron@example.com',
            customerName: 'Rohit Sharma',
            totalAmount: 245000,
            items: [{ name: 'Artisanal Teak Credenza', quantity: 1, price: '2,45,000' }],
            deliveryAddress: 'Bengaluru',
          },
        },
      ]);

      await useCase.execute();

      expect(mockInvoicePdfProvider.generatePdfForOrder).toHaveBeenCalledWith('order-999');
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'patron@example.com',
        expect.stringContaining('Order Confirmed: NFI-ORD-999'),
        expect.anything(),
        expect.objectContaining({
          type: NotificationType.ORDER_CONFIRMED,
          attachments: [
            expect.objectContaining({
              filename: 'NFI-INV-2026-001.pdf',
              contentType: 'application/pdf',
            }),
          ],
        }),
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'user-patron-1',
          type: NotificationType.ORDER_CONFIRMED,
        }),
      );

      expect(mockOutboxRepository.markProcessed).toHaveBeenCalledWith('event-order-1');
    });

    it('Case 3: should send 50% advance confirmation with PDF invoice on ORDER_MILESTONE_ADVANCE_PAID', async () => {
      mockOutboxRepository.findPending.mockResolvedValue([
        {
          id: 'event-advance-1',
          eventType: DomainEventType.ORDER_MILESTONE_ADVANCE_PAID,
          aggregateId: 'order-bespoke-1',
          payload: {
            orderNumber: 'NFI-BESPOKE-1',
            userId: 'user-patron-2',
            customerEmail: 'priya@example.com',
            customerName: 'Priya Nair',
            advanceAmount: 175000,
            balanceAmount: 175000,
            totalAmount: 350000,
            items: [{ name: 'Custom Dining Table', quantity: 1 }],
          },
        },
      ]);

      await useCase.execute();

      expect(mockInvoicePdfProvider.generatePdfForOrder).toHaveBeenCalledWith('order-bespoke-1');
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'priya@example.com',
        expect.stringContaining('50% Advance Received'),
        expect.anything(),
        expect.objectContaining({
          type: NotificationType.ORDER_ADVANCE_CONFIRMED,
          attachments: [
            expect.objectContaining({
              filename: 'NFI-INV-2026-001.pdf',
            }),
          ],
        }),
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'user-patron-2',
          type: NotificationType.ORDER_ADVANCE_CONFIRMED,
        }),
      );

      expect(mockOutboxRepository.markProcessed).toHaveBeenCalledWith('event-advance-1');
    });

    it('Case 4: should send balance reminder email and urgent in-app alert on ORDER_MILESTONE_BALANCE_DUE', async () => {
      mockOutboxRepository.findPending.mockResolvedValue([
        {
          id: 'event-balance-1',
          eventType: DomainEventType.ORDER_MILESTONE_BALANCE_DUE,
          aggregateId: 'order-bespoke-1',
          payload: {
            orderNumber: 'NFI-BESPOKE-1',
            userId: 'user-patron-2',
            customerEmail: 'priya@example.com',
            customerName: 'Priya Nair',
            balanceAmount: 175000,
            totalAmount: 350000,
            items: [{ name: 'Custom Dining Table', quantity: 1 }],
            actionUrl: 'https://nationalinteriors.in/orders/order-bespoke-1/pay-balance',
          },
        },
      ]);

      await useCase.execute();

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'priya@example.com',
        expect.stringContaining('Balance Due for Order #NFI-BESPOKE-1'),
        expect.anything(),
        expect.objectContaining({
          type: NotificationType.MILESTONE_BALANCE_DUE,
        }),
      );

      expect(mockNotificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'user-patron-2',
          type: NotificationType.MILESTONE_BALANCE_DUE,
          priority: NotificationPriority.URGENT,
        }),
      );

      expect(mockOutboxRepository.markProcessed).toHaveBeenCalledWith('event-balance-1');
    });
  });
});
