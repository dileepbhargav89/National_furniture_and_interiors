// Auth routes — docs/08_api_architecture.md §8's `auth` contract row:
//   no auth on /register, /login, /refresh (session-bootstrapping by definition)
//   Bearer on /logout and /mfa/*
//
// Rate-limit tiers are docs/08 §4.4's, applied HERE (the module decides the values) using
// core/security's generic factory, which supplies no values of its own — docs/06 §4.2.
import { Router } from 'express';
import { createRateLimiter } from '../../../core/security';
import type { createAuthController } from './auth.controller';

export function createAuthRoutes(
  controller: ReturnType<typeof createAuthController>,
  authMiddleware: import('express').RequestHandler,
): Router {
  const router = Router();
  const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

  // Limiters are constructed HERE, not at module scope: each one opens a Redis-backed store, and
  // importing this module must not create infrastructure connections as a side effect.

  /** Standard authenticated tier — 120 req/min for session refresh and logout. */
  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'auth-standard',
  });

  /** Login IP-level defense: max 10 requests/min per IP to prevent volumetric L7 floods. */
  const loginIpLimiter = createRateLimiter({
    windowMs: 60_000,
    max: isDevOrTest ? 1000 : 10,
    keyPrefix: 'auth-login-ip',
  });

  /**
   * Login Identity-level defense: max 5 failed attempts per 15 min per target email.
   * Protects individual accounts against distributed botnets while preventing showroom NAT false positives.
   */
  const loginAccountLimiter = createRateLimiter({
    windowMs: 15 * 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-login-account',
    keyGenerator: (req) => {
      const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
      return email || req.ip || 'anonymous';
    },
    skipSuccessfulRequests: true,
  });

  /** Registration limiter: max 5 account creations per 10 min per IP. */
  const registerLimiter = createRateLimiter({
    windowMs: 10 * 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-register',
  });

  /** Phone OTP send IP limiter: max 5 requests per min per IP. */
  const otpSendIpLimiter = createRateLimiter({
    windowMs: 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-otp-send-ip',
  });

  /** Phone OTP send Phone limiter: max 3 dispatches per 10 min per phone number. */
  const otpSendPhoneLimiter = createRateLimiter({
    windowMs: 10 * 60_000,
    max: isDevOrTest ? 1000 : 3,
    keyPrefix: 'auth-otp-send-phone',
    keyGenerator: (req) => {
      const phone = req.body?.phone ? String(req.body.phone).replace(/\s+/g, '') : '';
      return phone || req.ip || 'anonymous';
    },
  });

  /** Phone OTP verify limiter: max 5 attempts per 10 min per phone number. */
  const otpVerifyLimiter = createRateLimiter({
    windowMs: 10 * 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-otp-verify',
    keyGenerator: (req) => {
      const phone = req.body?.phone ? String(req.body.phone).replace(/\s+/g, '') : '';
      return phone || req.ip || 'anonymous';
    },
  });

  /** Forgot password limiter: max 3 reset requests per hour per email. */
  const forgotPasswordLimiter = createRateLimiter({
    windowMs: 60 * 60_000,
    max: isDevOrTest ? 1000 : 3,
    keyPrefix: 'auth-forgot-pwd',
    keyGenerator: (req) => {
      const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
      return email || req.ip || 'anonymous';
    },
  });

  /** Reset password token verification limiter: max 5 attempts per 15 min. */
  const resetPasswordLimiter = createRateLimiter({
    windowMs: 15 * 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-reset-pwd',
  });

  /** MFA verification limiter: max 5 attempts per 15 min per user. */
  const mfaVerifyLimiter = createRateLimiter({
    windowMs: 15 * 60_000,
    max: isDevOrTest ? 1000 : 5,
    keyPrefix: 'auth-mfa-verify',
    keyGenerator: (req) => {
      const userId = req.body?.userId ? String(req.body.userId).trim() : '';
      return userId || req.ip || 'anonymous';
    },
  });

  /** Social OAuth limiter: max 15 requests per min per IP. */
  const socialAuthLimiter = createRateLimiter({
    windowMs: 60_000,
    max: isDevOrTest ? 1000 : 15,
    keyPrefix: 'auth-social',
  });

  router.post('/register', registerLimiter, controller.register);
  router.post('/login', loginIpLimiter, loginAccountLimiter, controller.login);
  router.post('/refresh', standardLimiter, controller.refresh);

  // MFA setup/verify sit on explicit limiters
  router.post('/mfa/setup', standardLimiter, controller.mfaSetup);
  router.post('/mfa/verify', mfaVerifyLimiter, controller.mfaVerify);

  router.post('/logout', standardLimiter, authMiddleware, controller.logout);

  // Social Auth
  router.post('/google', socialAuthLimiter, controller.googleLogin);
  router.post('/facebook', socialAuthLimiter, controller.facebookLogin);

  // Phone OTP
  router.post('/otp/send', otpSendIpLimiter, otpSendPhoneLimiter, controller.sendOtp);
  router.post('/otp/verify', otpVerifyLimiter, controller.verifyOtp);

  // Self-service Password Recovery
  router.post('/forgot-password', forgotPasswordLimiter, controller.forgotPassword);
  router.post('/reset-password', resetPasswordLimiter, controller.resetPassword);

  return router;
}
