import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = createApp();
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

describe('GET /health', () => {
  it('returns 200 (liveness only — never depends on Mongo/Redis)', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.uptime).toBe('number');
    // docs/10_devops_architecture.md §10.4: liveness never reports dependency state.
    expect(body).not.toHaveProperty('mongoConnected');
    expect(body).not.toHaveProperty('redisConnected');
  });
});

describe('GET /ready', () => {
  it('returns 503 with dependency status when Mongo/Redis are not connected', async () => {
    // In this unit test neither connectDatabase() nor connectCache() has been called, so both
    // are correctly reported as not-yet-connected — this is the exact "instance not ready"
    // signal docs/10_devops_architecture.md §10.4 says must remove the instance from LB rotation.
    const response = await fetch(`${baseUrl}/ready`);
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe('not_ready');
    expect(typeof body.mongoConnected).toBe('boolean');
    expect(typeof body.redisConnected).toBe('boolean');
  });
});
