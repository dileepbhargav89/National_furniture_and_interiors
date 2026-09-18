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

  // Limiters are constructed HERE, not at module scope: each one opens a Redis-backed store, and
  // importing this module must not create infrastructure connections as a side effect.
  /** docs/08 §4.4 Strict tier — 5 req/min per IP on login/register/OTP endpoints (higher in dev for testing). */
  const strictLimiter = createRateLimiter({
    windowMs: 60_000,
    max: process.env.NODE_ENV === 'development' ? 100 : 5,
    keyPrefix: 'auth-strict',
  });
  /** docs/08 §4.4 Standard authenticated tier — 120 req/min. */
  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'auth-standard',
  });

  router.post('/register', strictLimiter, controller.register);
  router.post('/login', strictLimiter, controller.login);
  router.post('/refresh', standardLimiter, controller.refresh);

  // MFA setup/verify sit on the Strict tier: they are OTP endpoints, which docs/08 §4.4 names
  // explicitly alongside login/register.
  router.post('/mfa/setup', strictLimiter, controller.mfaSetup);
  router.post('/mfa/verify', strictLimiter, controller.mfaVerify);

  router.post('/logout', standardLimiter, authMiddleware, controller.logout);

  // Social Auth
  router.post('/google', strictLimiter, controller.googleLogin);
  router.post('/facebook', strictLimiter, controller.facebookLogin);

  // Phone OTP
  router.post('/otp/send', strictLimiter, controller.sendOtp);
  router.post('/otp/verify', strictLimiter, controller.verifyOtp);

  // Self-service Password Recovery
  router.post('/forgot-password', strictLimiter, controller.forgotPassword);
  router.post('/reset-password', strictLimiter, controller.resetPassword);

  return router;
}
