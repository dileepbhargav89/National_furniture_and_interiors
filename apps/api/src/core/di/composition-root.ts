// The composition root — docs/02_enterprise_architecture.md §7.3 (manual composition, not a DI
// framework — docs/07_technology_decision_record.md confirms this choice), docs/06_project_structure.md
// §4.2 ("the ONLY place concrete Infrastructure implementations are wired into Application-layer
// use-cases... never any actual business logic — this file only wires, it never decides").
//
// No module's Infrastructure/Application layers exist yet (auth/users/admin are still empty
// scaffolding — implementing them is explicitly out of scope for this foundation work). This file
// therefore only wires the cross-cutting infrastructure that already exists (logger, cache,
// database) into one shared context. When a module's repository/use-case classes are built, they
// are constructed and wired here — e.g. (illustrative, not real):
//
//   const userRepository = new MongoUserRepository(appContext.mongoose);
//   const registerUser = new RegisterUser(userRepository, tokenService);
//
// Nothing above is implemented — this comment exists only to show the extension point a future
// Sprint 1 change fills in, per this file's own "wires, never decides" rule.
import type { Redis } from 'ioredis';
import type mongoose from 'mongoose';
import type { Logger } from 'pino';
import { redisClient } from '../cache';
import mongooseInstance from 'mongoose';
import { logger } from '../logger';

export interface AppContext {
  readonly logger: Logger;
  readonly cache: Redis;
  readonly mongoose: typeof mongoose;
}

let appContext: AppContext | undefined;

/** Builds (once) and returns the shared cross-cutting infrastructure context every module's
 * future composition wiring will depend on. Idempotent — safe to call from multiple entry points
 * (server.ts, worker.ts, tests). */
export function buildAppContext(): AppContext {
  appContext ??= {
    logger,
    cache: redisClient,
    mongoose: mongooseInstance,
  };
  return appContext;
}
