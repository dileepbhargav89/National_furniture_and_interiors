import { Router } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import { createRateLimiter } from '../../../core/security';
import type { CompleteOnboarding, VerifyOnboardingToken } from '../application/user.use-cases';
import { completeOnboardingSchema, verifyOnboardingTokenSchema } from './validators';

export interface OnboardingRoutesDeps {
  verifyOnboardingToken: VerifyOnboardingToken;
  completeOnboarding: CompleteOnboarding;
  recordAudit?: (input: {
    actorId: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    after?: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
  }) => Promise<void>;
}

export function createOnboardingRoutes(deps: OnboardingRoutesDeps): Router {
  const router = Router();

  const onboardingLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 30,
    keyPrefix: 'onboarding-public',
  });

  router.use(onboardingLimiter, (_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  // GET /api/v1/onboarding/verify?token=...
  router.get('/verify', (req, res, next) => {
    void (async () => {
      try {
        const query = verifyOnboardingTokenSchema.parse({ token: req.query['token'] });
        const result = await deps.verifyOnboardingToken.execute(query.token);
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    })();
  });

  // POST /api/v1/onboarding/complete
  router.post('/complete', (req, res, next) => {
    void (async () => {
      try {
        const body = completeOnboardingSchema.parse(req.body);
        const result = await deps.completeOnboarding.execute({
          token: body.token,
          fullName: body.fullName,
          phone: body.phone ?? null,
          password: body.password,
          companyName: body.companyName ?? null,
          gstin: body.gstin ?? null,
          address: body.address,
          deviceInfo: {
            userAgent: req.header('User-Agent') || 'unknown',
            ip: req.ip || '127.0.0.1',
          },
        });

        if (deps.recordAudit) {
          await deps.recordAudit({
            actorId: result.user.id,
            actorRole: result.user.roleId,
            action: 'USER_ONBOARDING_COMPLETED',
            entityType: 'users',
            entityId: result.user.id,
            after: {
              email: result.user.email,
              status: result.user.status,
              onboardingStatus: result.user.onboardingStatus,
            },
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });
        }

        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    })();
  });

  return router;
}
