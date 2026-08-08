// Express application factory — infrastructure wiring only, no business routes yet (Sprint 1+
// mounts each module's presentation/routes here). docs/06_project_structure.md §4.1.
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { isCacheConnected } from './core/cache';
import { isDatabaseConnected } from './core/database';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Liveness/readiness probe — docs/10_devops_architecture.md §11. Infrastructure, not a business
  // module route, so it intentionally lives outside src/modules/ (docs/06_project_structure.md §4.2).
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      mongoConnected: isDatabaseConnected(),
      redisConnected: isCacheConnected(),
    });
  });

  return app;
}
