// docs/08_api_architecture.md §3.11: 401 Unauthorized -> error.code = UNAUTHENTICATED.
// Note: 02_enterprise_architecture.md §16 / docs/06_project_structure.md §4.2 name exactly four
// base error classes (NotFoundError, ValidationError, ConflictError, UnauthorizedError) — no
// ForbiddenError (403) is named. 403 handling belongs to `rbacMiddleware`/ownership checks
// (docs/08_api_architecture.md §4.3), which are auth-module business logic, out of scope for this
// foundation. A ForbiddenError subclass can be added the same way, with zero change to
// error-handler.middleware.ts, once that module actually needs it (YAGNI).
import { AppError } from './app-error';

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
  readonly code = 'UNAUTHENTICATED';

  constructor(message = 'Authentication required') {
    super(message);
  }
}
