import { ValidationError } from '../../../core/exceptions';
import { checkPasswordPolicy } from '../domain/password-policy';
import type { IAuthUserRepository, IPasswordHasher, IRefreshTokenRepository } from './ports';

export interface ResetPasswordInput {
  readonly token: string;
  readonly newPassword: string;
}

export interface ResetPasswordResult {
  readonly success: boolean;
  readonly message: string;
}

export class ResetPassword {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly sessions?: IRefreshTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordResult> {
    const token = input.token.trim();
    if (!token) {
      throw new ValidationError('Reset token is required');
    }

    const user = await this.users.findByPasswordResetToken(token);
    if (!user) {
      throw new ValidationError('The password reset link is invalid or has expired');
    }

    // Validate against domain password policy (length 10-128 chars)
    const policyViolation = checkPasswordPolicy(input.newPassword);
    if (policyViolation) {
      throw new ValidationError(policyViolation.message);
    }

    // Validate password history (docs/09 §2.7: check last 5 password hashes)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldHash of user.passwordHistory) {
        const matchesOld = await this.hasher.verify(input.newPassword, oldHash);
        if (matchesOld) {
          throw new ValidationError('New password cannot be one of your recent passwords');
        }
      }
    }

    // Also verify against current password hash
    if (user.passwordHash) {
      const matchesCurrent = await this.hasher.verify(input.newPassword, user.passwordHash);
      if (matchesCurrent) {
        throw new ValidationError('New password cannot be the same as your current password');
      }
    }

    const newHash = await this.hasher.hash(input.newPassword);
    const existingHistory = [
      ...(user.passwordHash ? [user.passwordHash] : []),
      ...(user.passwordHistory || []),
    ];

    await this.users.resetPassword(user.id, newHash, existingHistory);

    // Invalidate any active refresh token sessions for security (docs/09 §2.6)
    if (this.sessions) {
      try {
        await this.sessions.revokeAllForUser(user.id);
      } catch (err) {
        console.error('Failed to revoke sessions after password reset:', err);
      }
    }

    return {
      success: true,
      message:
        'Your password has been successfully updated. Please sign in with your new credentials.',
    };
  }
}
