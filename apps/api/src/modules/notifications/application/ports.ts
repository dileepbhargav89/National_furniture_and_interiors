import { Notification, NotificationType } from '../domain/notifications.types';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string | undefined;
}

export interface SendEmailOptions {
  type?: NotificationType | undefined;
  payload?: Record<string, unknown> | undefined;
  attachments?: EmailAttachment[] | undefined;
}

export interface IEmailService {
  sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: SendEmailOptions | undefined,
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
