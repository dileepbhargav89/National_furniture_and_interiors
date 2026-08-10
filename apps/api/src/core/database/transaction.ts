// Session/transaction helper — docs/06_project_structure.md §4.2 ("connection factory,
// session/transaction helper (for the narrow transaction use documented in
// docs/03_database_design.md §13.1)"). Generic infrastructure only: this file does not decide
// *which* operations use a transaction — docs/03 §13.1 narrowly scopes that to order+reservation
// and lead conversion, neither of which exists yet (Phase 5/Phase 3). No transaction boundary is
// invented here; this is the reusable mechanism a future module's Application-layer use case
// calls, not a use case itself.
import mongoose from 'mongoose';

/**
 * Runs `fn` inside a MongoDB multi-document transaction, committing on success and aborting on
 * any thrown error. The session is always ended. Reserved for the narrow set of operations
 * docs/03_database_design.md §13.1 names — most cross-module effects remain intentionally
 * event-driven and eventually consistent (docs/04_architecture_decision.md's Hybrid-readiness
 * design), so most write paths should NOT use this helper.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
