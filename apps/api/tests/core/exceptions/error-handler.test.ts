import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  ConflictError,
  errorHandlerMiddleware,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../src/core/exceptions';
import { requestIdMiddleware } from '../../../src/core/logger/request-id';

function buildTestApp(): Express {
  const app = express();
  app.use(requestIdMiddleware);

  app.get('/not-found', () => {
    throw new NotFoundError('Widget not found');
  });
  app.get('/validation', () => {
    throw new ValidationError('Bad input', [{ field: 'email', issue: 'must be a valid email' }]);
  });
  app.get('/conflict', () => {
    throw new ConflictError('Already exists');
  });
  app.get('/unauthorized', () => {
    throw new UnauthorizedError();
  });
  app.get('/zod', () => {
    z.object({ email: z.string().email() }).parse({ email: 'not-an-email' });
  });
  app.get('/boom', () => {
    throw new Error('something raw and unexpected');
  });

  app.use(errorHandlerMiddleware);
  return app;
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = buildTestApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected server to bind to a TCP port');
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe('errorHandlerMiddleware', () => {
  it('maps NotFoundError to 404 with the locked envelope', async () => {
    const res = await fetch(`${baseUrl}/not-found`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Widget not found' },
    });
    expect(body.meta.requestId).toBeTruthy();
  });

  it('maps ValidationError to 400 with field-level details', async () => {
    const res = await fetch(`${baseUrl}/validation`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual([{ field: 'email', issue: 'must be a valid email' }]);
  });

  it('maps ConflictError to 409', async () => {
    const res = await fetch(`${baseUrl}/conflict`);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe('CONFLICT');
  });

  it('maps UnauthorizedError to 401 UNAUTHENTICATED', async () => {
    const res = await fetch(`${baseUrl}/unauthorized`);
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe('UNAUTHENTICATED');
  });

  it('maps an unhandled ZodError to 400 VALIDATION_ERROR with per-field details', async () => {
    const res = await fetch(`${baseUrl}/zod`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(body.error.details)).toBe(true);
    expect(body.error.details[0].field).toBe('email');
  });

  it('maps a raw, unexpected Error to a generic 500 without leaking internals', async () => {
    const res = await fetch(`${baseUrl}/boom`);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('something raw and unexpected');
  });

  it('echoes a client-supplied X-Request-ID back on both header and envelope', async () => {
    const res = await fetch(`${baseUrl}/not-found`, {
      headers: { 'X-Request-ID': 'client-supplied-id-123' },
    });
    expect(res.headers.get('X-Request-ID')).toBe('client-supplied-id-123');
    const body = await res.json();
    expect(body.meta.requestId).toBe('client-supplied-id-123');
  });
});
