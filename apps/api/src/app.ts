// Express application factory — infrastructure wiring only, no business routes yet (Sprint 1+
// mounts each module's presentation/routes here). docs/06_project_structure.md §4.1.
import express, { type Express } from 'express';
import { errorHandlerMiddleware } from './core/exceptions';
import { requestIdMiddleware } from './core/logger/request-id';
import { corsPolicy, securityHeaders } from './core/security';
import { isCacheConnected } from './core/cache';
import { isDatabaseConnected } from './core/database';

export function createApp(): Express {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(express.json());

  // Liveness probe — docs/10_devops_architecture.md §10.4: "is the process alive?" only. Never
  // checks a dependency — a Mongo/Redis blip must NOT cause the orchestrator to restart a
  // perfectly-healthy process. Infrastructure, not a business module route, so it intentionally
  // lives outside src/modules/ (docs/06_project_structure.md §4.2).
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Readiness probe — docs/10_devops_architecture.md §10.4: "can this instance currently serve
  // traffic?" A readiness failure removes the instance from the load-balancer rotation without
  // restarting it (the orchestrator's job, not this endpoint's) — a dependency outage is exactly
  // the case this must reflect, not hide.
  app.get('/ready', (_req, res) => {
    const mongoConnected = isDatabaseConnected();
    const redisConnected = isCacheConnected();
    const ready = mongoConnected && redisConnected;
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? 'ready' : 'not_ready', mongoConnected, redisConnected });
  });

  // Centralized error-mapping middleware (docs/02_enterprise_architecture.md §16) must be
  // registered last — Express only invokes 4-arg middleware for errors passed via `next(err)`.
  app.use(errorHandlerMiddleware);

  return app;
}
