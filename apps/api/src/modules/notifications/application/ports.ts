import { Notification, NotificationType } from '../domain/notifications.types';

export interface IEmailService {
  sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: { type?: NotificationType | undefined; payload?: Record<string, unknown> | undefined } | undefined
  ): Promise<boolean>;
}

export interface ISmsService {
  sendSms(to: string, message: string): Promise<boolean>;
}

export interface IWhatsAppService {
  sendWhatsAppMessage(to: string, message: string): Promise<boolean>;
}

export interface INotificationProvider {
  send(notification: Notification): Promise<void>;
}

export type { INotificationRepository } from '../domain/notifications.types';
