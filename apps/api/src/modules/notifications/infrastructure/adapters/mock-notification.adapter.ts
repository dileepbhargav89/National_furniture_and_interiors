import { Notification } from '../../domain/notifications.types';
import { INotificationProvider } from '../../application/ports';

export class MockNotificationAdapter implements INotificationProvider {
  async send(notification: Notification): Promise<void> {
    // In MVP, we just log to console instead of using SendGrid or Twilio
    // eslint-disable-next-line no-console
    console.log(`[MOCK NOTIFICATION] Channel: ${notification.channel}, Type: ${notification.type}`);
    // eslint-disable-next-line no-console
    console.log(`[MOCK NOTIFICATION] To: ${notification.recipientId || 'BROADCAST'}`);
    // eslint-disable-next-line no-console
    console.log(`[MOCK NOTIFICATION] Title: ${notification.title}`);
    // eslint-disable-next-line no-console
    console.log(`[MOCK NOTIFICATION] Message: ${notification.message}`);
  }
}
