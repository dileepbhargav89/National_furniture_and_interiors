import { ISmsService } from '../../application/ports';

export class MockSmsService implements ISmsService {
  async sendSms(to: string, message: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log(`[MockSmsService] Sending SMS to: ${to}`);
    // eslint-disable-next-line no-console
    console.log(`[MockSmsService] Message: ${message}`);
    return true;
  }
}
