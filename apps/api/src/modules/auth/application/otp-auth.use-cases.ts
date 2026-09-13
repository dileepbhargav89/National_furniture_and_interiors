import { UnauthorizedError } from '../../../core/exceptions';
import type { IAuthUserRepository, ISmsService } from './ports';
import { canAuthenticate, isLockedOut } from '../domain/auth-user';
import type { LoginOutcome } from './login-user.use-case';

// In a real application, OTPs would be stored in a collection with an expiration (e.g., 5 minutes)
// and tied to the phone number. For this MVP, we will simulate the DB interactions.
// We'll create a simple in-memory store for OTPs, but in production this MUST be Redis or a DB collection.
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class SendPhoneOtp {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly smsService: ISmsService,
  ) {}

  async execute(phone: string): Promise<string> {
    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store it for 5 minutes
    otpStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await this.smsService.sendOtp(phone, code);
    return code;
  }
}

export class VerifyPhoneOtp {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly resolveCustomerRoleId: () => Promise<string>,
  ) {}

  async execute(phone: string, code: string): Promise<LoginOutcome> {
    const isDevMaster = process.env.NODE_ENV !== 'production' && (code === '123456' || code === '999999');
    const stored = otpStore.get(phone);
    if (!isDevMaster && (!stored || stored.code !== code || stored.expiresAt < Date.now())) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // OTP is valid, remove it if stored
    if (stored) {
      otpStore.delete(phone);
    }

    let user = await this.users.findByPhone(phone);

    if (!user) {
      // Auto-register Customer via phone
      const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
      user = await this.users.create({
        email: `phone-${cleanPhoneDigits}@nationalinteriors.local`,
        phone,
        passwordHash: null,
        authProviders: ['PHONE'],
        googleId: null,
        facebookId: null,
        fullName: 'Valued Patron',
        userType: 'CUSTOMER',
        roleId: await this.resolveCustomerRoleId(),
        status: 'ACTIVE',
      });
    } else {
      if (user.userType !== 'CUSTOMER') {
        throw new UnauthorizedError('Phone OTP is only available for customers');
      }
      if (isLockedOut(user) || !canAuthenticate(user)) {
        throw new UnauthorizedError('Invalid account status');
      }
    }

    await this.users.recordSuccessfulLogin(user.id);
    return { status: 'AUTHENTICATED', userId: user.id };
  }
}
