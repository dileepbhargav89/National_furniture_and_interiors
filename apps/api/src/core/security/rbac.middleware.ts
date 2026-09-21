// rbacMiddleware — step 2 of docs/08_api_architecture.md §4.3's three-stage enforcement order:
//
//   1. authMiddleware   — JWT signature/expiry -> 401            (auth module's presentation layer)
//   2. rbacMiddleware   — permission-key check -> 403             (THIS FILE)
//   3. ownership check  — inside the Application-layer use case    (each owning module)
//
// Why this lives in core/security and step 3 does not: docs/06 §4.2's `security/` row specifies
// "Generic middleware factories" and excludes "module-specific authorization logic… (a rule like
// 'only the assigned Designer can edit this project' belongs in that module's Application layer)".
// This factory compares token claims to a caller-supplied list of keys and knows nothing about any
// module — it is exactly the generic case. Ownership predicates stay in their modules.
//
// docs/08 §4.3's critical rule: a step-2 failure and a step-3 failure return the IDENTICAL error
// shape, because distinguishing them would leak resource existence/assignment to an unauthorized
// caller (docs/09 §11 rule 11, OWASP API1:2023).
//
// docs/09 §2.2's fail-closed principle: any ambiguity resolves to denial, never to allow.
import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../exceptions';

/**
 * Structural shape of the verified access-token claims. Declared here, in core, rather than
 * imported from the auth module — core must not depend on module code (root CLAUDE.md), and the
 * auth module's own richer `AccessTokenClaims` is structurally assignable to this.
 */
export interface RequestAuthClaims {
  sub: string;
  userType: string;
  roleId: string;
  roleName?: string;
  permissions: string[];
  jti?: string | undefined;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: RequestAuthClaims;
    }
  }
}

/**
 * Requires ALL of the given permission keys. Keys come from the verified access token's claims
 * (docs/02 §9.1 — the token carries resolved permission keys, not just a role name), so this
 * check needs no database round-trip.
 */
export function requirePermissions(...requiredKeys: string[]) {
  return function rbacMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const claims = req.auth;
    if (!claims) {
      // authMiddleware did not run, or did not populate claims. Fail closed.
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    // Super Admin and Admin have universal authority across the entire website
    if (
      claims.userType === 'ADMIN' ||
      claims.roleName === 'SUPER_ADMIN' ||
      claims.roleName === 'ADMIN' ||
      claims.permissions.includes('*')
    ) {
      next();
      return;
    }

    const held = new Set(claims.permissions);
    const hasPerm = (neededKey: string): boolean => {
      if (held.has(neededKey)) return true;
      // Interoperability between hyphen and underscore (e.g. design-projects vs design_projects)
      const altKey = neededKey.includes('-')
        ? neededKey.replace(/-/g, '_')
        : neededKey.replace(/_/g, '-');
      if (held.has(altKey)) return true;
      // Interoperability between .manage and .write (e.g. payments.manage vs payments.write)
      if (neededKey.endsWith('.manage') && held.has(neededKey.replace(/\.manage$/, '.write')))
        return true;
      if (neededKey.endsWith('.write') && held.has(neededKey.replace(/\.write$/, '.manage')))
        return true;
      // Interoperability for self actions (e.g. reviews.write_self, cart.read_self) for authenticated customers
      if (
        neededKey.endsWith('_self') &&
        (held.has(neededKey.replace(/_self$/, '')) ||
          claims.userType === 'CUSTOMER' ||
          claims.roleName === 'CUSTOMER')
      )
        return true;
      return false;
    };

    if (requiredKeys.some((key) => !hasPerm(key))) {
      // Deliberately names no key — see the docs/08 §4.3 note above.
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

/**
 * docs/08 §8's `admin` row: "Bearer, required, STAFF/ADMIN userType only" — a userType gate,
 * distinct from and additional to the permission-key check.
 */
export function requireStaffOrAdmin() {
  return function staffOnlyMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const claims = req.auth;
    if (!claims) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }
    if (claims.userType !== 'STAFF' && claims.userType !== 'ADMIN') {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}
