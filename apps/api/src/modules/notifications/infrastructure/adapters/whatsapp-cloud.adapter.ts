import { IWhatsAppService } from '../../application/ports';

export class WhatsAppCloudAdapter implements IWhatsAppService {
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(token?: string, phoneNumberId?: string) {
    this.token = token || process.env.WHATSAPP_API_TOKEN || process.env.SMS_WHATSAPP_PROVIDER_API_KEY || '';
    this.phoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  isConfigured(): boolean {
    return (
      Boolean(this.token) &&
      Boolean(this.phoneNumberId) &&
      !this.token.includes('placeholder') &&
      !this.token.startsWith('sms_dev_')
    );
  }

  async sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(to);

    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.log(`\n================== [NFI WHATSAPP CONCIERGE SIMULATION] ==================`);
      // eslint-disable-next-line no-console
      console.log(`To Phone: ${formattedPhone}`);
      // eslint-disable-next-line no-console
      console.log(`Status: Simulated Sandbox Mode (pending WhatsApp Cloud / Meta API keys)`);
      // eslint-disable-next-line no-console
      console.log(`Message Content:\n${message}`);
      // eslint-disable-next-line no-console
      console.log(`========================================================================\n`);
      return true;
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: message,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error(`[WhatsAppCloudAdapter] Error (${response.status}):`, errorText);
        return false;
      }

      // eslint-disable-next-line no-console
      console.log(`[WhatsAppCloudAdapter] Message dispatched successfully to ${formattedPhone}`);
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[WhatsAppCloudAdapter] Network error sending WhatsApp message:', err);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Strip non-digits
    let cleaned = phone.replace(/\D/g, '');
    // If 10 digits Indian number, prefix with 91
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    return cleaned;
  }
}
