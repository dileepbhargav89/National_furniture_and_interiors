// Migration contract — docs/13_deployment_strategy.md §5.1's three MongoDB change categories
// (index change, $jsonSchema validator change, data backfill). No SQL-style up/down pairing:
// §5.2's expand/contract rule means a migration must be safe to apply while the *previous*
// application version is still running, so rollback is a new forward migration, not an inverse
// (§6.2). Every migration is idempotent (§5.1's data-backfill requirement, applied to all three
// categories) and carries its own post-migration verification (§5.5).
// Driver types come via mongoose's own re-export (`mongoose.mongo`) rather than a direct `mongodb`
// import — mongoose is the locked ODM (docs/07_technology_decision_record.md §5), and pnpm's strict
// non-hoisted install (docs/05 §13) correctly does not expose its transitive driver as a top-level
// import. This adds no dependency.
import type mongoose from 'mongoose';

export type Db = mongoose.mongo.Db;

export type MigrationCategory = 'index' | 'validator' | 'backfill';

export interface Migration {
  /** Monotonic, zero-padded, unique. Doubles as the ordering key. */
  readonly id: string;
  readonly description: string;
  readonly category: MigrationCategory;
  /** Must be safe to run repeatedly — docs/13 §5.1. */
  apply(db: Db): Promise<void>;
  /**
   * Post-migration validation — docs/13_deployment_strategy.md §5.5: "a migration is not
   * considered complete until this check passes". Throw to fail the run.
   */
  verify(db: Db): Promise<void>;
}
