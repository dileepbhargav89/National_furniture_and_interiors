// Request-ID propagation — docs/06_project_structure.md §4.2 ("Logger factory, request-ID
// middleware"), docs/08_api_architecture.md §3.1 (X-Request-ID: client-supplied or
// server-generated UUIDv4, propagated through logs).
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('X-Request-ID');
  req.id = incoming && incoming.length > 0 ? incoming : randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}
