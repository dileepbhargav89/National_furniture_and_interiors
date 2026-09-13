import { apiClient } from './client';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'PUSH';

export type NotificationType =
  | 'LEAD_ASSIGNED'
  | 'ORDER_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'DESIGN_PROPOSAL_READY'
  | 'STUDIO_VISIT_SCHEDULED'
  | 'ORDER_IN_PRODUCTION'
  | 'INVOICE_GENERATED'
  | 'SECURITY_ALERT'
  | 'BROADCAST'
  | 'GENERAL';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

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
  readAt?: string | undefined;
  status: NotificationStatus;
  failureReason?: string | undefined;
  sentAt?: string | undefined;
  expiresAt?: string | undefined;
  createdAt: string;
}

export interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  unreadInApp: number;
  byChannel: Record<NotificationChannel, number>;
}

export interface EmailPreviewResult {
  subject: string;
  html: string;
  text: string;
}

export interface TestSendParams {
  channel: NotificationChannel;
  type?: NotificationType | undefined;
  recipient: string;
  title?: string | undefined;
  message?: string | undefined;
}

export interface BroadcastParams {
  title: string;
  message: string;
  channel?: NotificationChannel | undefined;
  priority?: NotificationPriority | undefined;
  actionUrl?: string | undefined;
  actionLabel?: string | undefined;
}

export const NotificationsService = {
  /**
   * List all notifications (Admin operations hub)
   */
  listNotifications: async (limit: number = 20, offset: number = 0) => {
    return apiClient.get<Notification[]>(`/api/v1/notifications?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get personal in-app notifications for the logged-in customer/admin
   */
  getMyNotifications: async (limit: number = 20, offset: number = 0) => {
    return apiClient.get<Notification[]>(`/api/v1/notifications/my?limit=${limit}&offset=${offset}`);
  },

  /**
   * Get unread notifications count for live badge display
   */
  getUnreadCount: async () => {
    return apiClient.get<{ success: boolean; count: number }>(`/api/v1/notifications/my/unread-count`);
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string) => {
    return apiClient.put<{ success: boolean; message: string }>(`/api/v1/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    return apiClient.put<{ success: boolean; message: string; modified: number }>(`/api/v1/notifications/my/read-all`);
  },

  /**
   * Get delivery statistics and channel health breakdown (Admin)
   */
  getStats: async () => {
    return apiClient.get<NotificationStats>(`/api/v1/notifications/stats`);
  },

  /**
   * Dispatch a test notification through Resend, WhatsApp, SMS, or In-App sandbox
   */
  testSend: async (params: TestSendParams) => {
    return apiClient.post<{ success: boolean; message: string; data: unknown }>(`/api/v1/notifications/test-send`, params);
  },

  /**
   * Publish a system-wide broadcast notification
   */
  broadcast: async (params: BroadcastParams) => {
    return apiClient.post<{ success: boolean; message: string; data: unknown }>(`/api/v1/notifications/broadcast`, params);
  },

  /**
   * Preview a responsive luxury HTML email template live
   */
  previewTemplate: async (type: NotificationType, data?: Record<string, unknown> | undefined) => {
    return apiClient.post<EmailPreviewResult>(`/api/v1/notifications/preview-template`, { type, data });
  },
};
