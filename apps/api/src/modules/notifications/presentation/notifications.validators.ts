import { z } from 'zod';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../domain/notifications.types';

export const createNotificationSchema = z.object({
  body: z.object({
    recipientId: z.string().nullable().optional(),
    channel: z.nativeEnum(NotificationChannel),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority).optional(),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    actionUrl: z.string().optional(),
    actionLabel: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
  }).strict(),
});

export const listNotificationsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0),
  }).strict(),
});

export const markAsReadSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid notification ID'),
  }).strict(),
});

export const testSendNotificationSchema = z.object({
  body: z.object({
    channel: z.nativeEnum(NotificationChannel),
    type: z.nativeEnum(NotificationType).default(NotificationType.GENERAL),
    recipient: z.string().min(1, 'Recipient (email, phone, or user ID) is required'),
    title: z.string().optional(),
    message: z.string().optional(),
  }).strict(),
});

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Broadcast title is required'),
    message: z.string().min(1, 'Broadcast message is required'),
    channel: z.nativeEnum(NotificationChannel).default(NotificationChannel.IN_APP),
    priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
    actionUrl: z.string().optional(),
    actionLabel: z.string().optional(),
  }).strict(),
});

export const previewTemplateSchema = z.object({
  body: z.object({
    type: z.nativeEnum(NotificationType),
    data: z.record(z.unknown()).optional(),
  }).strict(),
});
