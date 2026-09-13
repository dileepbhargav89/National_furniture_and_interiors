import {
  CreateNotificationParams,
  INotificationRepository,
  Notification,
  NotificationChannel,
  NotificationPriority,
  NotificationStats,
  NotificationStatus,
  NotificationType,
} from '../../domain/notifications.types';
import { NotificationModel } from '../models/notification.model';

export class MongoNotificationRepository implements INotificationRepository {
  async create(params: CreateNotificationParams): Promise<Notification> {
    const doc = new NotificationModel({
      recipientId: params.recipientId,
      channel: params.channel,
      type: params.type,
      priority: params.priority ?? NotificationPriority.NORMAL,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl ?? null,
      actionLabel: params.actionLabel ?? null,
      payload: params.payload ?? null,
      expiresAt: params.expiresAt ?? null,
    });
    await doc.save();
    return this.mapToDomain(doc);
  }

  async findAll(limit: number, offset: number, userId?: string): Promise<Notification[]> {
    const query = userId ? { recipientId: userId } : {};
    const docs = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.mapToDomain(doc as Record<string, unknown>));
  }

  async findByRecipient(recipientId: string, limit: number, offset: number): Promise<Notification[]> {
    // Return both recipient-specific notifications and global broadcast notifications
    const query = {
      $or: [{ recipientId }, { recipientId: null }],
    };
    const docs = await NotificationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
    return docs.map((doc) => this.mapToDomain(doc as Record<string, unknown>));
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await NotificationModel.findById(id).exec();
    if (!doc) return null;
    return this.mapToDomain(doc as Record<string, unknown>);
  }

  async countUnread(recipientId?: string): Promise<number> {
    const query: Record<string, unknown> = {
      isRead: false,
      channel: NotificationChannel.IN_APP,
    };
    if (recipientId) {
      query.$or = [{ recipientId }, { recipientId: null }];
    }
    return NotificationModel.countDocuments(query).exec();
  }

  async markSent(id: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      failureReason: null,
    });
  }

  async markFailed(id: string, reason?: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(id, {
      status: NotificationStatus.FAILED,
      failureReason: reason ?? 'Unknown error',
    });
  }

  async markAsRead(id: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      {
        $or: [{ recipientId }, { recipientId: null }],
        isRead: false,
        channel: NotificationChannel.IN_APP,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    ).exec();

    return res.modifiedCount;
  }

  async getStats(): Promise<NotificationStats> {
    const [total, sent, failed, pending, unreadInApp] = await Promise.all([
      NotificationModel.countDocuments().exec(),
      NotificationModel.countDocuments({ status: NotificationStatus.SENT }).exec(),
      NotificationModel.countDocuments({ status: NotificationStatus.FAILED }).exec(),
      NotificationModel.countDocuments({ status: NotificationStatus.PENDING }).exec(),
      NotificationModel.countDocuments({ channel: NotificationChannel.IN_APP, isRead: false }).exec(),
    ]);

    const channelCounts = await NotificationModel.aggregate<{ _id: NotificationChannel; count: number }>([
      { $group: { _id: '$channel', count: { $sum: 1 } } },
    ]).exec();

    const byChannel: Record<NotificationChannel, number> = {
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.WHATSAPP]: 0,
      [NotificationChannel.IN_APP]: 0,
      [NotificationChannel.PUSH]: 0,
    };

    for (const item of channelCounts) {
      if (item._id && byChannel[item._id] !== undefined) {
        byChannel[item._id] = item.count;
      }
    }

    return {
      total,
      sent,
      failed,
      pending,
      unreadInApp,
      byChannel,
    };
  }

  private mapToDomain(doc: Record<string, unknown>): Notification {
    return {
      id: String(doc._id),
      recipientId: (doc.recipientId as string | null) ?? null,
      channel: doc.channel as NotificationChannel,
      type: doc.type as NotificationType,
      priority: (doc.priority as NotificationPriority) || NotificationPriority.NORMAL,
      title: String(doc.title || ''),
      message: String(doc.message || ''),
      actionUrl: (doc.actionUrl as string) ?? undefined,
      actionLabel: (doc.actionLabel as string) ?? undefined,
      payload: doc.payload as Record<string, unknown> | undefined,
      isRead: !!doc.isRead,
      readAt: (doc.readAt as Date) ?? undefined,
      status: doc.status as NotificationStatus,
      failureReason: (doc.failureReason as string) ?? undefined,
      sentAt: (doc.sentAt as Date) ?? undefined,
      expiresAt: (doc.expiresAt as Date) ?? undefined,
      createdAt: (doc.createdAt as Date) || new Date(),
      updatedAt: (doc.updatedAt as Date) || new Date(),
    };
  }
}
