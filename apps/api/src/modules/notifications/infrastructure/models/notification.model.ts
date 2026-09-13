import mongoose from 'mongoose';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../../domain/notifications.types';

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      default: null, // null for broadcast or system-wide alerts; can be user ID, guest email, or phone
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.NORMAL,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    actionUrl: {
      type: String,
      default: null,
    },
    actionLabel: {
      type: String,
      default: null,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      required: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast in-app retrieval & unread count
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

// TTL Index for auto-cleanup (MongoDB automatically deletes documents where expiresAt has passed)
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const NotificationModel = (mongoose.models.Notification || mongoose.model('Notification', NotificationSchema, 'notifications')) as mongoose.Model<Record<string, unknown>>;
