// Auth controllers — docs/06 §4.3: presentation/ "calls application/ use-cases only; never
// imports infrastructure/ or domain/ directly" (mechanically enforced by the module-boundary
// ESLint rule). Every handler validates with a strict Zod schema, then delegates.
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../../core/config';
import type { LoginUser } from '../application/login-user.use-case';
import type { IssueSession } from '../application/issue-session.use-case';
import type { SetupMfa, VerifyMfa } from '../application/mfa.use-cases';
import type { RegisterUser } from '../application/register-user.use-case';
import type { LogoutUser, RefreshTokenUseCase } from '../application/refresh-token.use-case';
import type {
  AuthenticateWithGoogle,
  AuthenticateWithFacebook,
} from '../application/social-auth.use-cases';
import type { SendPhoneOtp, VerifyPhoneOtp } from '../application/otp-auth.use-cases';
import type { ForgotPassword } from '../application/forgot-password.use-case';
import type { ResetPassword } from '../application/reset-password.use-case';
import {
  loginSchema,
  mfaSetupSchema,
  mfaVerifySchema,
  registerSchema,
  googleAuthSchema,
  facebookAuthSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './validators';
import { sendSuccess, ValidationError } from '../../../core/exceptions';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from './response';

export interface AuthControllerDeps {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  issueSession: IssueSession;
  setupMfa: SetupMfa;
  verifyMfa: VerifyMfa;
  refreshToken: RefreshTokenUseCase;
  logoutUser: LogoutUser;
  resolveRoleName: (roleId: string) => Promise<string>;
  resolveRoleIdForUser: (userId: string) => Promise<string>;
  authenticateWithGoogle: AuthenticateWithGoogle;
  authenticateWithFacebook: AuthenticateWithFacebook;
  sendPhoneOtp: SendPhoneOtp;
  verifyPhoneOtp: VerifyPhoneOtp;
  forgotPassword?: ForgotPassword;
  resetPassword?: ResetPassword;
}

function deviceInfo(req: Request): { userAgent: string; ip: string } {
  return { userAgent: req.header('User-Agent') ?? '', ip: req.ip ?? '' };
}

export function createAuthController(deps: AuthControllerDeps) {
  const isProduction = env.NODE_ENV === 'production';

  return {
    /** POST /auth/register — ADR-0002 Option A: creates CUSTOMER accounts only and issues session. */
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = registerSchema.parse(req.body);
        const result = await deps.registerUser.execute({
          email: body.email,
          password: body.password,
          fullName: body.fullName,
          ...(body.phone !== undefined ? { phone: body.phone } : {}),
        });

        // Automatically issue authenticated session for customer convenience upon registration
        const roleId = await deps.resolveRoleIdForUser(result.userId);
        const tokens = await deps.issueSession.execute({
          userId: result.userId,
          roleName: await deps.resolveRoleName(roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );

        sendSuccess(req, res, 201, {
          ...result,
          status: 'AUTHENTICATED',
          accessToken: tokens.accessToken,
        });
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/login — returns an MFA challenge for privileged accounts, a session for customers. */
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = loginSchema.parse(req.body);
        const outcome = await deps.loginUser.execute(body);

        if (outcome.status !== 'AUTHENTICATED') {
          // docs/09 §2.8 — no session is issued until MFA is satisfied. The userId returned here
          // is an intermediate handle for the /auth/mfa/* step, not an authenticated session.
          sendSuccess(req, res, 200, { status: outcome.status, userId: outcome.userId });
          return;
        }

        const roleId = await deps.resolveRoleIdForUser(outcome.userId);
        const tokens = await deps.issueSession.execute({
          userId: outcome.userId,
          roleName: await deps.resolveRoleName(roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { status: 'AUTHENTICATED', accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/mfa/setup — enrolment; returns a provisioning URI, never the raw secret. */
    async mfaSetup(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = mfaSetupSchema.parse(req.body);
        sendSuccess(req, res, 200, await deps.setupMfa.execute(body.userId));
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/mfa/verify — completes enrolment on first use, then issues the session. */
    async mfaVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = mfaVerifySchema.parse(req.body);
        const verified = await deps.verifyMfa.execute(body);
        const tokens = await deps.issueSession.execute({
          userId: verified.userId,
          roleName: await deps.resolveRoleName(verified.roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { status: 'AUTHENTICATED', accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/refresh — rotation on every use, with reuse detection (docs/09 §2.6). */
    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const presented = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
        if (!presented) {
          sendSuccess(req, res, 401, null);
          return;
        }

        const rotated = await deps.refreshToken.execute({
          presentedToken: presented,
          deviceInfo: deviceInfo(req),
        });
        const tokens = await deps.issueSession.execute({
          userId: rotated.userId,
          roleName: rotated.roleName,
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/logout — revokes the stored refresh token and clears the cookie. */
    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        await deps.logoutUser.execute(req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined);
        res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth/refresh' });
        sendSuccess(req, res, 200, null);
      } catch (error) {
        next(error);
      }
    },

    async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = googleAuthSchema.parse(req.body);
        const outcome = await deps.authenticateWithGoogle.execute(body.idToken);

        if (outcome.status !== 'AUTHENTICATED') {
          sendSuccess(req, res, 200, { status: outcome.status, userId: outcome.userId });
          return;
        }

        const roleId = await deps.resolveRoleIdForUser(outcome.userId);
        const tokens = await deps.issueSession.execute({
          userId: outcome.userId,
          roleName: await deps.resolveRoleName(roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { status: 'AUTHENTICATED', accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    async facebookLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = facebookAuthSchema.parse(req.body);
        const outcome = await deps.authenticateWithFacebook.execute(body.accessToken);

        if (outcome.status !== 'AUTHENTICATED') {
          sendSuccess(req, res, 200, { status: outcome.status, userId: outcome.userId });
          return;
        }

        const roleId = await deps.resolveRoleIdForUser(outcome.userId);
        const tokens = await deps.issueSession.execute({
          userId: outcome.userId,
          roleName: await deps.resolveRoleName(roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { status: 'AUTHENTICATED', accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = sendOtpSchema.parse(req.body);
        const code = await deps.sendPhoneOtp.execute(body.phone);
        sendSuccess(req, res, 200, {
          message: 'OTP sent successfully',
          ...(isProduction ? {} : { demoOtp: code }),
        });
      } catch (error) {
        next(error);
      }
    },

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = verifyOtpSchema.parse(req.body);
        const outcome = await deps.verifyPhoneOtp.execute(body.phone, body.code);

        if (outcome.status !== 'AUTHENTICATED') {
          sendSuccess(req, res, 200, { status: outcome.status, userId: outcome.userId });
          return;
        }

        const roleId = await deps.resolveRoleIdForUser(outcome.userId);
        const tokens = await deps.issueSession.execute({
          userId: outcome.userId,
          roleName: await deps.resolveRoleName(roleId),
          deviceInfo: deviceInfo(req),
        });

        res.cookie(
          REFRESH_COOKIE_NAME,
          tokens.refreshToken,
          refreshCookieOptions(tokens.refreshTokenExpiresAt, isProduction),
        );
        sendSuccess(req, res, 200, { status: 'AUTHENTICATED', accessToken: tokens.accessToken });
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/forgot-password — Requests password reset token/link */
    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = forgotPasswordSchema.parse(req.body);
        if (!deps.forgotPassword) {
          throw new Error('ForgotPassword use case is not configured');
        }
        const result = await deps.forgotPassword.execute({ email: body.email });
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    },

    /** POST /auth/reset-password — Validates token and resets password */
    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = resetPasswordSchema.parse(req.body);
        if (!deps.resetPassword) {
          throw new Error('ResetPassword use case is not configured');
        }
        const targetPassword = body.password || body.newPassword;
        if (!targetPassword) {
          throw new ValidationError('Password is required');
        }
        const result = await deps.resetPassword.execute({
          token: body.token,
          newPassword: targetPassword,
        });
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    },
  };
}
