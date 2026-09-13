import type { ISmsService } from '../application/ports';

export class MockSmsService implements ISmsService {
  async sendOtp(phone: string, code: string): Promise<void> {
    // In a real application, this would integrate with Twilio, AWS SNS, etc.
    // For now, we mock the SMS sending.
    console.log(`[Mock SMS] Sending OTP ${code} to phone number: ${phone}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
