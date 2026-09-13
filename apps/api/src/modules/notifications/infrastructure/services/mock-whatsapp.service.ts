import { IWhatsAppService } from '../../application/ports';

export class MockWhatsAppService implements IWhatsAppService {
  async sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log(`[MockWhatsAppService] Sending WhatsApp to: ${to}`);
    // eslint-disable-next-line no-console
    console.log(`[MockWhatsAppService] Message: ${message}`);
    return true;
  }
}
