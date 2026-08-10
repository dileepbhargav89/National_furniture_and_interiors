// docs/08_api_architecture.md §3.11: 404 Not Found -> error.code = NOT_FOUND.
import { AppError } from './app-error';

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(message = 'Resource not found') {
    super(message);
  }
}
