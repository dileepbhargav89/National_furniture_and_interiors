import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { errorHandlerMiddleware } from '../../../src/core/exceptions';
import { corsPolicy } from '../../../src/core/security';
import { requestIdMiddleware } from '../../../src/core/logger/request-id';

// vitest.config.ts sets CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

function buildTestApp(): Express {
  const app = express();
  // requestId + errorHandlerMiddleware mirror app.ts's real pipeline so a rejected origin is asserted
  // against the status the API actually returns, not against corsPolicy in isolation.
  app.use(requestIdMiddleware);
  app.use(corsPolicy);
  app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
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

describe('corsPolicy', () => {
  it('allows an origin present in CORS_ALLOWED_ORIGINS, with credentials enabled', async () => {
    const res = await fetch(`${baseUrl}/ping`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('rejects an origin absent from CORS_ALLOWED_ORIGINS with 403, never reflecting it', async () => {
    const res = await fetch(`${baseUrl}/ping`, {
      headers: { Origin: 'http://evil.example' },
    });
    // Two independent guarantees. (1) The origin is never reflected — this is what actually stops
    // a real browser, which enforces the block itself rather than this fetch call. (2) The status
    // is docs/08 §3.11's 403/FORBIDDEN, not a 500: a working policy must not report itself as an
    // unexpected server fault into docs/10 §6.2's 5xx error-rate alerting.
    expect(res.headers.get('access-control-allow-origin')).not.toBe('http://evil.example');
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('FORBIDDEN');
    // docs/09 §11 rule 11 — the caller-controlled origin is not echoed back.
    expect(body.error.message).not.toContain('evil.example');
  });

  it('rejects a disallowed origin on the preflight too, not just the actual request', async () => {
    const res = await fetch(`${baseUrl}/ping`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example',
        'Access-Control-Request-Method': 'GET',
      },
    });
    expect(res.status).toBe(403);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('allows requests with no Origin header (server-to-server, curl)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.status).toBe(200);
  });
});
