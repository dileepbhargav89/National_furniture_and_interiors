import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import {
  CreateAndSendNotificationUseCase,
  ListNotificationsUseCase,
  GetMyNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllAsReadUseCase,
  SendTestNotificationUseCase,
  GetDeliveryStatsUseCase,
} from '../application/notifications.use-cases';
import {
  createNotificationSchema,
  listNotificationsSchema,
  markAsReadSchema,
  testSendNotificationSchema,
  broadcastNotificationSchema,
  previewTemplateSchema,
} from './notifications.validators';
import {
  renderGeneralNotificationEmail,
  renderOrderConfirmedEmail,
  renderDesignProposalReadyEmail,
  renderPaymentReceiptEmail,
  renderStudioVisitScheduledEmail,
  renderLeadWelcomeEmail,
} from '../infrastructure/templates/email-templates';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../domain/notifications.types';
import { NotificationEventHub } from '../infrastructure/services/notification-event-hub';

export class NotificationsController {
  private readonly eventHub: NotificationEventHub;

  constructor(
    private readonly listUseCase: ListNotificationsUseCase,
    private readonly markAsReadUseCase: MarkNotificationAsReadUseCase,
    private readonly createUseCase: CreateAndSendNotificationUseCase,
    private readonly getMyNotificationsUseCase?: GetMyNotificationsUseCase,
    private readonly getUnreadCountUseCase?: GetUnreadCountUseCase,
    private readonly markAllAsReadUseCase?: MarkAllAsReadUseCase,
    private readonly sendTestNotificationUseCase?: SendTestNotificationUseCase,
    private readonly getDeliveryStatsUseCase?: GetDeliveryStatsUseCase,
    eventHub?: NotificationEventHub,
  ) {
    this.eventHub = eventHub ?? NotificationEventHub.getInstance();
  }

  /**
   * Server-Sent Events stream for instant sub-second notifications
   */
  stream = (req: Request, res: Response): void => {
    const userId = req.auth?.sub || 'anonymous';
    const roles = req.auth?.roleName ? [req.auth.roleName] : [];
    const permissions = req.auth?.permissions || [];
    const clientId = `${userId}_${randomUUID().slice(0, 8)}`;

    const client = this.eventHub.registerClient(clientId, userId, res, roles, permissions);

    req.on('close', () => {
      this.eventHub.removeClient(client.id);
    });
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createNotificationSchema.parse(req);
      const result = await this.createUseCase.execute({
        recipientId: parsed.body.recipientId || null,
        channel: parsed.body.channel,
        type: parsed.body.type,
        priority: parsed.body.priority,
        title: parsed.body.title,
        message: parsed.body.message,
        actionUrl: parsed.body.actionUrl,
        actionLabel: parsed.body.actionLabel,
        payload: parsed.body.payload,
      });

      if (result.channel === NotificationChannel.IN_APP) {
        if (result.recipientId) {
          this.eventHub.sendToUser(result.recipientId, 'notification', result);
        } else {
          this.eventHub.broadcastToStaff('notification', result);
        }
      }

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = listNotificationsSchema.parse(req);
      const limit = parsed.query.limit;
      const offset = parsed.query.offset;
      const userId = req.auth?.sub;

      const notifications = await this.listUseCase.execute(limit, offset, userId);

      res.json({
        success: true,
        data: notifications,
        meta: {
          limit,
          offset,
          count: notifications.length,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getMyNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const parsed = listNotificationsSchema.parse(req);
      const limit = parsed.query.limit;
      const offset = parsed.query.offset;

      const notifications = this.getMyNotificationsUseCase
        ? await this.getMyNotificationsUseCase.execute(userId, limit, offset)
        : await this.listUseCase.execute(limit, offset, userId);

      res.json({
        success: true,
        data: notifications,
        meta: {
          limit,
          offset,
          count: notifications.length,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.json({ success: true, count: 0 });
        return;
      }

      const count = this.getUnreadCountUseCase
        ? await this.getUnreadCountUseCase.execute(userId)
        : 0;

      res.json({ success: true, count });
    } catch (error: unknown) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = markAsReadSchema.parse(req);
      const id = parsed.params.id;
      await this.markAsReadUseCase.execute(id);
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error: unknown) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      let modified = 0;
      if (this.markAllAsReadUseCase) {
        modified = await this.markAllAsReadUseCase.execute(userId);
      }

      res.json({ success: true, message: 'All notifications marked as read', modified });
    } catch (error: unknown) {
      next(error);
    }
  };

  testSend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = testSendNotificationSchema.parse(req);

      if (!this.sendTestNotificationUseCase) {
        res.status(501).json({ success: false, message: 'Test send not configured' });
        return;
      }

      const result = await this.sendTestNotificationUseCase.execute(parsed.body);
      res.json({
        success: true,
        message: `Test notification queued for delivery via ${parsed.body.channel}`,
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  broadcast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = broadcastNotificationSchema.parse(req);
      const result = await this.createUseCase.execute({
        recipientId: null, // null recipient = global broadcast
        channel: parsed.body.channel,
        type: NotificationType.BROADCAST,
        priority: parsed.body.priority || NotificationPriority.NORMAL,
        title: parsed.body.title,
        message: parsed.body.message,
        actionUrl: parsed.body.actionUrl,
        actionLabel: parsed.body.actionLabel,
      });

      if (result.channel === NotificationChannel.IN_APP) {
        this.eventHub.broadcastToStaff('notification', result);
      }

      res.status(201).json({
        success: true,
        message: 'Broadcast notification published successfully',
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.getDeliveryStatsUseCase) {
        res.status(501).json({ success: false, message: 'Stats not supported' });
        return;
      }

      const stats = await this.getDeliveryStatsUseCase.execute();
      res.json({ success: true, data: stats });
    } catch (error: unknown) {
      next(error);
    }
  };

  previewTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = previewTemplateSchema.parse(req);
      const { type, data = {} } = parsed.body;

      let rendered;
      switch (type) {
        case NotificationType.ORDER_CONFIRMED:
          rendered = renderOrderConfirmedEmail({
            orderId: (data.orderId as string) || 'NFI-DEMO-8891',
            customerName: (data.customerName as string) || 'Rajesh Mehta',
            totalAmount: (data.totalAmount as string | number) || '1,85,000',
            items: [
              { name: 'Artisan Solid Teak Credenza', quantity: 1, price: '1,25,000' },
              {
                name: 'Handcrafted Fluted Wall Panel (Brass Accent)',
                quantity: 2,
                price: '60,000',
              },
            ],
            deliveryAddress: 'Penthouse 4B, Kingfisher Towers, Lavelle Road, Bengaluru',
            actionUrl: 'https://nationalinteriors.in/orders',
          });
          break;

        case NotificationType.DESIGN_PROPOSAL_READY:
          rendered = renderDesignProposalReadyEmail({
            projectName:
              (data.projectName as string) || 'Bespoke Penthouse Residence — Koramangala',
            clientName: (data.clientName as string) || 'Ananya Sen',
            designerName: 'Kavita Rao',
            actionUrl: 'https://nationalinteriors.in/client-portal',
            teaserNote:
              'Full 3D panoramic layout, bespoke Italian Calacatta marble wall finishes, and custom dimmable cove lighting integration.',
          });
          break;

        case NotificationType.PAYMENT_RECEIVED:
          rendered = renderPaymentReceiptEmail({
            paymentId: (data.paymentId as string) || 'PAY_NFI_778192',
            orderId: (data.orderId as string) || 'NFI-ORD-9021',
            customerName: (data.customerName as string) || 'Vikramaditya Hegde',
            amount: '2,50,000',
            method: 'Razorpay UPI / Corporate Net Banking',
            invoiceUrl: 'https://nationalinteriors.in/invoices/demo',
          });
          break;

        case NotificationType.STUDIO_VISIT_SCHEDULED:
          rendered = renderStudioVisitScheduledEmail({
            clientName: (data.clientName as string) || 'Priya & Siddharth Sharma',
            studioLocation: 'Indiranagar Flagship Design Studio, 100ft Road, Bengaluru',
            scheduledTime: 'Saturday, September 20, 2026 at 11:30 AM',
            conciergeName: 'Arjun Menon',
            actionUrl: 'https://nationalinteriors.in/contact',
          });
          break;

        case NotificationType.LEAD_ASSIGNED:
          rendered = renderLeadWelcomeEmail({
            clientName: (data.clientName as string) || 'Dr. Arvind Swaminathan',
            requirementType: 'Full Villa Interior Architecture (4BHK)',
            assignedConsultant: 'Rohan Deshmukh, Principal Architect',
            phone: '+91 98450 12345',
          });
          break;

        default:
          rendered = renderGeneralNotificationEmail({
            title: (data.title as string) || 'National Interiors Exclusive Announcement',
            message:
              (data.message as string) ||
              'Experience our new Autumn 2026 Heirloom Furniture Collection in our Bengaluru studios.',
            actionLabel: 'Explore Collection',
            actionUrl: 'https://nationalinteriors.in/catalog',
          });
          break;
      }

      res.json({
        success: true,
        data: rendered,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
