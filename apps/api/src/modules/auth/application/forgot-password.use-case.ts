import crypto from 'crypto';
import type { IAuthUserRepository } from './ports';

export interface ForgotPasswordInput {
  readonly email: string;
}

export interface ForgotPasswordResult {
  readonly success: boolean;
  readonly message: string;
  readonly resetToken?: string;
}

export interface IEmailNotificationService {
  sendEmail(options: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}

export class ForgotPassword {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly emailService?: IEmailNotificationService,
    private readonly storefrontUrl: string = process.env.STOREFRONT_URL || 'http://localhost:3000',
  ) {}

  async execute(input: ForgotPasswordInput): Promise<ForgotPasswordResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalizedEmail);

    // Defense-in-depth against user enumeration (ADR-0002 / docs/09 §10)
    // Also protect suspended or inactive accounts from token issuance without leaking status
    if (!user || user.status !== 'ACTIVE') {
      return {
        success: true,
        message:
          'If an account exists with this email address, a password reset link has been dispatched.',
      };
    }

    // Generate cryptographically secure 32-byte hex token with 1-hour expiration
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.users.setPasswordResetToken(user.id, resetToken, expiresAt);

    const resetLink = `${this.storefrontUrl}/reset-password?token=${resetToken}`;

    if (this.emailService) {
      try {
        await this.emailService.sendEmail({
          to: user.email,
          subject: 'Reset Your Password — National Furniture & Interiors',
          text: `Hello,\n\nYou recently requested to reset your password for National Furniture & Interiors.\n\nPlease use the following link to reset your password:\n${resetLink}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n\nWarm regards,\nNational Furniture & Interiors Concierge`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #FAF9F6; border: 1px solid #E6DFD5; border-radius: 14px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #171717; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">National Furniture & Interiors</h1>
                <p style="color: #8C7355; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 4px 0 0 0;">✦ Est. 1998 · Bengaluru Atelier ✦</p>
              </div>
              <div style="background-color: #FFFFFF; border: 1px solid #EBE4D8; border-radius: 10px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <h2 style="color: #171717; font-size: 17px; margin-top: 0; font-weight: 600;">Password Recovery Request</h2>
                <p style="color: #44403C; font-size: 14px; line-height: 1.6;">Hello,</p>
                <p style="color: #44403C; font-size: 14px; line-height: 1.6;">You recently requested to reset the password for your National Furniture & Interiors account. Click the button below to establish a new password:</p>
                <div style="margin: 28px 0; text-align: center;">
                  <a href="${resetLink}" style="background-color: #171717; color: #D4AF37; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; border: 1px solid #C5A059; display: inline-block; box-shadow: 0 4px 12px rgba(23,23,23,0.15);">Reset My Password</a>
                </div>
                <p style="color: #78716C; font-size: 12px; line-height: 1.5; margin-bottom: 0;">This cryptographic link is strictly valid for <strong>1 hour</strong>. If you did not initiate this request, your account remains secure and no further action is required.</p>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <p style="color: #A8A29E; font-size: 11px; margin: 0;">Need concierge assistance? Reach out to support@nationalinteriors.in</p>
                <p style="color: #A8A29E; font-size: 11px; margin: 4px 0 0 0;">© 2026 National Furniture & Interiors. All rights reserved.</p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        // Log error securely without blocking user response
        console.error('[ForgotPassword] Failed to dispatch password reset email:', err);
      }
    }

    return {
      success: true,
      message:
        'If an account exists with this email address, a password reset link has been dispatched.',
      // Expose reset token for development and non-production testing
      ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {}),
    };
  }
}
