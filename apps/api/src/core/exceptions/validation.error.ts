// docs/08_api_architecture.md §3.3 & §3.11: 400 Bad Request -> error.code = VALIDATION_ERROR,
// error.details is an array of {field, issue} entries mirroring Zod's own per-field issue shape.
import { AppError } from './app-error';

export interface ValidationIssue {
  field: string;
  issue: string;
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message = 'Validation failed', details?: ValidationIssue[]) {
    super(message, details);
  }
}
