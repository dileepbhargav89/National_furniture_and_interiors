// docs/08_api_architecture.md §3.11: 409 Conflict -> error.code = CONFLICT (state conflicts,
// optimistic-concurrency version mismatches, idempotency-key reuse with a different body).
import { AppError } from './app-error';

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message = 'Request conflicts with current state') {
    super(message);
  }
}
