import { IEmailService } from '../../application/ports';

export class MockEmailService implements IEmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log(`[MockEmailService] Sending email to: ${to}`);
    // eslint-disable-next-line no-console
    console.log(`[MockEmailService] Subject: ${subject}`);
    // eslint-disable-next-line no-console
    console.log(`[MockEmailService] Body: ${body}`);
    return true;
  }
}
