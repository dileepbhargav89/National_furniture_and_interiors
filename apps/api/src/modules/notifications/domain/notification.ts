import {
  Notification as INotification,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  CreateNotificationParams,
} from './notifications.types';

export class NotificationEntity implements INotification {
  public id: string;
  public recipientId: string | null;
  public channel: NotificationChannel;
  public type: NotificationType;
  public priority: NotificationPriority;
  public title: string;
  public message: string;
  public actionUrl?: string | undefined;
  public actionLabel?: string | undefined;
  public payload?: Record<string, unknown> | undefined;
  public isRead: boolean;
  public readAt?: Date | undefined;
  public status: NotificationStatus;
  public failureReason?: string | undefined;
  public sentAt?: Date | undefined;
  public expiresAt?: Date | undefined;
  public createdAt: Date;
  public updatedAt: Date;

  private constructor(props: INotification) {
    this.id = props.id;
    this.recipientId = props.recipientId;
    this.channel = props.channel;
    this.type = props.type;
    this.priority = props.priority ?? NotificationPriority.NORMAL;
    this.title = props.title;
    this.message = props.message;
    this.actionUrl = props.actionUrl;
    this.actionLabel = props.actionLabel;
    this.payload = props.payload;
    this.isRead = props.isRead;
    this.readAt = props.readAt;
    this.status = props.status;
    this.failureReason = props.failureReason;
    this.sentAt = props.sentAt;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(params: CreateNotificationParams): NotificationEntity {
    const now = new Date();
    return new NotificationEntity({
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
    });
  }

  public static reconstruct(props: INotification): NotificationEntity {
    return new NotificationEntity(props);
  }

  public markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  public markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
    this.failureReason = undefined;
    this.updatedAt = new Date();
  }

  public markAsFailed(reason?: string): void {
    this.status = NotificationStatus.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();
  }
}
