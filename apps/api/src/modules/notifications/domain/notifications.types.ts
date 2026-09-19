export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
}

export enum NotificationType {
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  LEAD_CUSTOMER_WELCOME = 'LEAD_CUSTOMER_WELCOME',
  LEAD_CONCIERGE_ALERT = 'LEAD_CONCIERGE_ALERT',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_ADVANCE_CONFIRMED = 'ORDER_ADVANCE_CONFIRMED',
  MILESTONE_BALANCE_DUE = 'MILESTONE_BALANCE_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DESIGN_PROPOSAL_READY = 'DESIGN_PROPOSAL_READY',
  STUDIO_VISIT_SCHEDULED = 'STUDIO_VISIT_SCHEDULED',
  ORDER_IN_PRODUCTION = 'ORDER_IN_PRODUCTION',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  BROADCAST = 'BROADCAST',
  GENERAL = 'GENERAL',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface Notification {
  id: string;
  recipientId: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string | undefined;
  actionLabel?: string | undefined;
  payload?: Record<string, unknown> | undefined;
  isRead: boolean;
  readAt?: Date | undefined;
  status: NotificationStatus;
  failureReason?: string | undefined;
  sentAt?: Date | undefined;
  expiresAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationParams {
  recipientId: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  priority?: NotificationPriority | undefined;
  title: string;
  message: string;
  actionUrl?: string | undefined;
  actionLabel?: string | undefined;
  payload?: Record<string, unknown> | undefined;
  expiresAt?: Date | undefined;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  unreadInApp: number;
  byChannel: Record<NotificationChannel, number>;
}

export interface INotificationRepository {
  create(params: CreateNotificationParams): Promise<Notification>;
  findAll(limit: number, offset: number, userId?: string): Promise<Notification[]>;
  findByRecipient(recipientId: string, limit: number, offset: number): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  countUnread(recipientId?: string): Promise<number>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, reason?: string): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(recipientId: string): Promise<number>;
  getStats(): Promise<NotificationStats>;
}
