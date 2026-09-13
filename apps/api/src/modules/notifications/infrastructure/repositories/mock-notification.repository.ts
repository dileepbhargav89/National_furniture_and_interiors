import {
  INotificationRepository,
  Notification,
  CreateNotificationParams,
  NotificationStatus,
  NotificationChannel,
  NotificationPriority,
  NotificationStats,
} from '../../domain/notifications.types';

export class MockNotificationRepository implements INotificationRepository {
  private notifications: Notification[] = [];

  async create(params: CreateNotificationParams): Promise<Notification> {
    const now = new Date();
    const notification: Notification = {
      id: crypto.randomUUID(),
      recipientId: params.recipientId,
      channel: params.channel,
      type: params.type,
      priority: params.priority ?? NotificationPriority.NORMAL,
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      payload: params.payload,
      isRead: false,
      status: NotificationStatus.PENDING,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    this.notifications.push(notification);
    return notification;
  }

  async findAll(limit: number, offset: number, userId?: string): Promise<Notification[]> {
    let filtered = this.notifications;
    if (userId) {
      filtered = filtered.filter(n => n.recipientId === userId || n.recipientId === null);
    }
    return filtered.slice(offset, offset + limit);
  }

  async findByRecipient(recipientId: string, limit: number, offset: number): Promise<Notification[]> {
    const filtered = this.notifications.filter(
      n => n.recipientId === recipientId || n.recipientId === null
    );
    return filtered.slice(offset, offset + limit);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.find(n => n.id === id) || null;
  }

  async countUnread(recipientId?: string): Promise<number> {
    return this.notifications.filter(n => {
      const matchRecipient = !recipientId || n.recipientId === recipientId || n.recipientId === null;
      return matchRecipient && n.channel === NotificationChannel.IN_APP && !n.isRead;
    }).length;
  }

  async markSent(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.status = NotificationStatus.SENT;
      notif.sentAt = new Date();
      notif.failureReason = undefined;
      notif.updatedAt = new Date();
    }
  }

  async markFailed(id: string, reason?: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.status = NotificationStatus.FAILED;
      notif.failureReason = reason ?? 'Failed';
      notif.updatedAt = new Date();
    }
  }

  async markAsRead(id: string): Promise<void> {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      notif.readAt = new Date();
      notif.updatedAt = new Date();
    }
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    let count = 0;
    for (const notif of this.notifications) {
      if (
        (notif.recipientId === recipientId || notif.recipientId === null) &&
        notif.channel === NotificationChannel.IN_APP &&
        !notif.isRead
      ) {
        notif.isRead = true;
        notif.readAt = new Date();
        notif.updatedAt = new Date();
        count++;
      }
    }
    return count;
  }

  async getStats(): Promise<NotificationStats> {
    const byChannel: Record<NotificationChannel, number> = {
      [NotificationChannel.EMAIL]: 0,
      [NotificationChannel.SMS]: 0,
      [NotificationChannel.WHATSAPP]: 0,
      [NotificationChannel.IN_APP]: 0,
      [NotificationChannel.PUSH]: 0,
    };

    let sent = 0;
    let failed = 0;
    let pending = 0;
    let unreadInApp = 0;

    for (const n of this.notifications) {
      if (byChannel[n.channel] !== undefined) {
        byChannel[n.channel]++;
      }
      if (n.status === NotificationStatus.SENT) sent++;
      if (n.status === NotificationStatus.FAILED) failed++;
      if (n.status === NotificationStatus.PENDING) pending++;
      if (n.channel === NotificationChannel.IN_APP && !n.isRead) unreadInApp++;
    }

    return {
      total: this.notifications.length,
      sent,
      failed,
      pending,
      unreadInApp,
      byChannel,
    };
  }
}
