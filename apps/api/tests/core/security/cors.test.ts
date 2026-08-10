import type { Server } from 'node:http';
import express, { type Express } from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { corsPolicy } from '../../../src/core/security';

// vitest.config.ts sets CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

function buildTestApp(): Express {
  const app = express();
  app.use(corsPolicy);
  app.get('/ping', (_req, res) => res.status(200).json({ ok: true }));
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

  it('does not reflect an origin absent from CORS_ALLOWED_ORIGINS', async () => {
    const res = await fetch(`${baseUrl}/ping`, {
      headers: { Origin: 'http://evil.example' },
    });
    // The request itself still completes server-side (a real browser enforces the block, not
    // this fetch call) — the assertable server behavior is that it never reflects the
    // disallowed origin back in the response header.
    expect(res.headers.get('access-control-allow-origin')).not.toBe('http://evil.example');
  });

  it('allows requests with no Origin header (server-to-server, curl)', async () => {
    const res = await fetch(`${baseUrl}/ping`);
    expect(res.status).toBe(200);
  });
});
