// docs/08_api_architecture.md §3.11: 403 Forbidden -> error.code = FORBIDDEN, produced when a
// caller holds a valid token but lacks the required permission key, or fails an ownership check.
//
// Placement note: docs/02_enterprise_architecture.md §16 and docs/06 §4.2 enumerate four base
// classes (NotFound/Validation/Conflict/Unauthorized) and do not name a Forbidden class. It is
// added here rather than inside a module because the 403 code itself IS locked (docs/08 §3.11's
// status table) and both core/security's rbacMiddleware and every module's ownership check need
// to raise it — putting it in one module would force the others to import that module's internals,
// which docs/06 §1.6 forbids.
import { AppError } from './app-error';

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code = 'FORBIDDEN';

  /**
   * docs/08 §4.3 / docs/09 §11 rule 11: the message must NOT reveal whether the failure was a
   * missing permission key or a failed ownership check — that distinction leaks resource
   * existence/assignment to an unauthorized caller (OWASP API1:2023). The default is deliberately
   * generic and callers should not pass a more specific one.
   */
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}
