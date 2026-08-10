// Centralized error-mapping middleware — docs/02_enterprise_architecture.md §16, mapping every
// AppError subclass (and Zod validation failures) to the one locked response envelope
// (docs/08_api_architecture.md §3.2-3.3) and HTTP status table (§3.11). error.message is always
// safe to render to an end user; internal details (stack traces) are logged, never returned
// (OWASP API8:2023, docs/09_security_architecture.md §3's output-hardening principle).
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger';
import { AppError } from './app-error';
import { buildErrorResponse } from './error-response';

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // Express requires a 4-arg signature to recognize this as an error-handling middleware even
  // though `next` is unused here (this is always the terminal handler in the chain).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const requestId = req.id ?? 'unknown';

  if (err instanceof AppError) {
    logger.warn({ err, requestId, code: err.code }, 'Request failed with a known AppError');
    const body = buildErrorResponse({
      code: err.code,
      message: err.message,
      details: err.details,
      requestId,
    });
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));
    logger.warn({ err, requestId }, 'Request failed Zod validation');
    res.status(400).json(
      buildErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        requestId,
      }),
    );
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  res.status(500).json(
    buildErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
    }),
  );
}
