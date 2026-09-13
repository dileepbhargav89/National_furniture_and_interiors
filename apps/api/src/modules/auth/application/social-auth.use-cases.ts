import { UnauthorizedError } from '../../../core/exceptions';
import type { IAuthUserRepository, IGoogleAuthService, IFacebookAuthService } from './ports';
import { canAuthenticate, isLockedOut, requiresMfaEnrolment } from '../domain/auth-user';
import { requiresMfa } from '../domain/user-type';
import type { LoginOutcome } from './login-user.use-case';

export class AuthenticateWithGoogle {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly googleAuth: IGoogleAuthService,
    private readonly resolveCustomerRoleId: () => Promise<string>,
  ) {}

  async execute(idToken: string): Promise<LoginOutcome> {
    const payload = await this.googleAuth.verifyIdToken(idToken);
    
    let user = await this.users.findByEmail(payload.email);

    if (!user) {
      // Auto-register Customer
      user = await this.users.create({
        email: payload.email,
        phone: null,
        passwordHash: null,
        authProviders: ['GOOGLE'],
        googleId: payload.sub,
        facebookId: null,
        fullName: payload.name || payload.email.split('@')[0] || 'User',
        userType: 'CUSTOMER',
        roleId: await this.resolveCustomerRoleId(),
        status: 'ACTIVE',
      });
    } else {
      if (isLockedOut(user) || !canAuthenticate(user)) {
        throw new UnauthorizedError('Invalid account status');
      }
      
      // Update missing Google info if they signed up differently
      // In a real application, you'd want a separate update method in the repo for this
      // But for simplicity, we just proceed.
    }

    if (requiresMfaEnrolment(user)) {
      return { status: 'MFA_ENROLMENT_REQUIRED', userId: user.id };
    }

    if (requiresMfa(user.userType)) {
      return { status: 'MFA_REQUIRED', userId: user.id };
    }

    await this.users.recordSuccessfulLogin(user.id);
    return { status: 'AUTHENTICATED', userId: user.id };
  }
}

export class AuthenticateWithFacebook {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly facebookAuth: IFacebookAuthService,
    private readonly resolveCustomerRoleId: () => Promise<string>,
  ) {}

  async execute(accessToken: string): Promise<LoginOutcome> {
    const payload = await this.facebookAuth.verifyAccessToken(accessToken);
    
    let user = await this.users.findByEmail(payload.email);

    if (!user) {
      // Auto-register Customer
      user = await this.users.create({
        email: payload.email,
        phone: null,
        passwordHash: null,
        authProviders: ['FACEBOOK'],
        googleId: null,
        facebookId: payload.id,
        fullName: payload.name || payload.email.split('@')[0] || 'User',
        userType: 'CUSTOMER',
        roleId: await this.resolveCustomerRoleId(),
        status: 'ACTIVE',
      });
    } else {
      if (isLockedOut(user) || !canAuthenticate(user)) {
        throw new UnauthorizedError('Invalid account status');
      }
    }

    if (requiresMfaEnrolment(user)) {
      return { status: 'MFA_ENROLMENT_REQUIRED', userId: user.id };
    }

    if (requiresMfa(user.userType)) {
      return { status: 'MFA_REQUIRED', userId: user.id };
    }

    await this.users.recordSuccessfulLogin(user.id);
    return { status: 'AUTHENTICATED', userId: user.id };
  }
}
