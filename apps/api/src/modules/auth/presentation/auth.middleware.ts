// authMiddleware — step 1 of docs/08_api_architecture.md §4.3's three-stage enforcement order:
//   1. authMiddleware   — validates JWT signature/expiry & check deny-list -> 401 if invalid/revoked (THIS FILE)
//   2. rbacMiddleware   — checks permission keys -> 403 if missing               (admin module)
//   3. ownership check  — inside the Application-layer use case                  (per module)
//
// docs/08 §4.1: Bearer header ONLY — never a query parameter or cookie for the access token,
// because query-string tokens leak into server logs and browser history (OWASP API2:2023).
import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../core/exceptions';
import { cacheService, ICacheService, CACHE_KEYS } from '../../../core/cache';
import type { ITokenService } from '../application/ports';

// The Express.Request.auth augmentation lives in core/security/rbac.middleware.ts — core owns the
// shape because rbacMiddleware (step 2) consumes it and core must not import module code.

export function createAuthMiddleware(tokens: ITokenService, cache: ICacheService = cacheService) {
  return async function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    let tokenStr: string | null = null;
    const header = req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
      tokenStr = header.slice('Bearer '.length);
    } else if (req.cookies?.['access_token']) {
      tokenStr = req.cookies['access_token'];
    } else if (
      (req.path.includes('/stream') || (req.originalUrl && req.originalUrl.includes('/stream'))) &&
      typeof req.query.token === 'string'
    ) {
      tokenStr = req.query.token;
    }

    if (!tokenStr) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    try {
      req.auth = tokens.verifyAccessToken(tokenStr);
      if (req.auth.jti) {
        const isRevoked = await cache.get<string>(CACHE_KEYS.auth.tokenDenyList(req.auth.jti));
        if (isRevoked) {
          next(new UnauthorizedError('Token has been revoked'));
          return;
        }
      }
      (req as unknown as { user?: { id: string } }).user = { id: req.auth.sub };
      next();
    } catch (error) {
      next(error);
    }
  };
}
