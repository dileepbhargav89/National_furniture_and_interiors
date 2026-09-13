import { ISmsService } from '../../application/ports';

export class Msg91SmsAdapter implements ISmsService {
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly templateId?: string | undefined;

  constructor(authKey?: string, senderId = 'NATINT', templateId?: string | undefined) {
    this.authKey = authKey || process.env.MSG91_AUTH_KEY || process.env.SMS_WHATSAPP_PROVIDER_API_KEY || '';
    this.senderId = senderId;
    this.templateId = templateId || process.env.MSG91_TEMPLATE_ID;
  }

  isConfigured(): boolean {
    return (
      Boolean(this.authKey) &&
      !this.authKey.includes('placeholder') &&
      !this.authKey.startsWith('sms_dev_')
    );
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(to);

    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.log(`\n================== [NFI HIGH-PRIORITY SMS SIMULATION] ==================`);
      // eslint-disable-next-line no-console
      console.log(`To Phone: ${formattedPhone}`);
      // eslint-disable-next-line no-console
      console.log(`Sender ID: ${this.senderId}`);
      // eslint-disable-next-line no-console
      console.log(`Status: Simulated Sandbox Mode (pending MSG91 / Twilio credentials)`);
      // eslint-disable-next-line no-console
      console.log(`SMS Content: ${message}`);
      // eslint-disable-next-line no-console
      console.log(`=======================================================================\n`);
      return true;
    }

    try {
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: this.templateId || 'default',
          sender: this.senderId,
          short_url: '0',
          recipients: [
            {
              mobiles: formattedPhone,
              message,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        // eslint-disable-next-line no-console
        console.error(`[Msg91SmsAdapter] Error (${response.status}):`, errText);
        return false;
      }

      // eslint-disable-next-line no-console
      console.log(`[Msg91SmsAdapter] SMS dispatched to ${formattedPhone}`);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Msg91SmsAdapter] Network error sending SMS:', err);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  }
}
