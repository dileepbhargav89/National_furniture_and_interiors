# Architecture Review Decision Sheet — ADR-0001 (`schema_migrations`)

**For:** Architecture Review (`docs/11` §8.3)
**ADR:** `docs/adr/0001-schema-migrations-collection.md`
**Current status:** **RECOMMENDED — HUMAN APPROVAL REQUIRED**
**Decision time estimate:** ~5 minutes — this is the least contentious item in the pack.

---

## 1. Problem

`docs/13_deployment_strategy.md` §5.6 requires a `schema_migrations` collection recording which migrations have been applied and when, so a deployment can programmatically verify whether a database's schema state matches what the application version expects.

That collection is **not** among `docs/03_database_design.md` §4's 35 collections. `docs/18_CLAUDE_CONSTITUTION.md` §2.6 makes closing this gap binding: it "MUST be formally closed via ADR **before or during its first use**, not silently implemented."

Sprint 1's database foundation created the first migrations — so first use has arrived.

## 2. Proposed Decision

Add `schema_migrations` to `docs/03` §4's Collection Inventory as a 36th collection:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `migrationId` | String | unique — matches the script's numeric prefix (`0001`, `0002`, …) |
| `description` | String | copied from the migration |
| `category` | Enum | `index` \| `validator` \| `backfill` — `docs/13` §5.1's three change types |
| `appliedAt` | Date | |
| `appliedBy` | String | deploy actor / CI run identifier |
| `verifiedAt` | Date \| null | set once `docs/13` §5.5's post-migration validation passes |

Index: `{migrationId: 1}` unique. Classification: deployment-tooling metadata — **no business data, no PII** (`docs/09` §1.4: no tier applies), **no soft delete** (append-only; `docs/03` §3.1's soft-delete strategy does not apply).

## 3. Alternatives

| Option | Assessment |
|---|---|
| **1. Add the collection** *(proposed)* | Matches `docs/13` §5.6 exactly; smallest change |
| 2. Track state outside MongoDB (artifact file / CI-side) | **Rejected** — a database restored from backup (`docs/10` §10.6) would carry no record of its own migration state, which is precisely the drift §5.6 exists to prevent |
| 3. Idempotency only, no tracking | **Rejected as permanent**; **currently in force as the interim state.** Makes getting it wrong non-destructive but gives no programmatic answer to "what state is this database in", and leaves `docs/13` §10.2 unsatisfiable |

## 4. Evidence

| Source | Statement |
|---|---|
| `docs/13` §5.6 | Specifies the collection, its purpose, and its role in schema versioning |
| `docs/13` §14 | "should be formally added to that document's Collection Inventory (§4) via the ADR process… at implementation time" |
| `docs/16` §8.3 item 3 | Names it as a recommended improvement |
| `docs/16` §17 | "Three items… should become formal ADRs early in implementation… **none of these changes an approved architectural decision** — each is a small, additive extension the ADR process exists precisely to handle" |
| `docs/17` §12.1 | Carries it as a known gap |
| `docs/18` §2.6 | Makes closure via ADR **binding** before/during first use |

**Re-verified this session:** all six citations confirmed present and unchanged; `docs/03` §4 still contains 35 collections with no `schema_migrations` entry. **The evidence continues to support Option 1.** No locked document requires an alternative.

## 5. Implementation Consequence (if Approved)

1. `docs/03` §4 gains one row plus a Revision History entry citing this ADR (`docs/18` §5.1's remediation pattern).
2. `packages/database/migrations/run.ts` records each applied migration at the extension point already marked in the file (~15 lines).
3. A third migration creates the collection and its unique index.
4. `docs/13` §10.2's release-checklist item "Recorded in the `schema_migrations` tracking collection" becomes satisfiable.

**Currently NOT implemented.** `docs/18` §6.4 — "the ADR must be Approved *before* dependent implementation code is written."

## 6. Rollback Consequence

Low risk. The collection holds only tooling metadata; dropping it loses migration history but no business data and breaks no application code path (the runner tolerates its absence today by design). Per `docs/13` §5.2's expand/contract rule, removal would be a forward migration, not an inverse.

## 7. Required Approvers

- **Principal Database Architect** — owns `docs/03` (`docs/17` §8)
- **Principal Software Architect** — `docs/18` §6.3's standing circulation requirement

## 8. Exact Approval Statement Required

> **ADR-0001 is APPROVED.** `schema_migrations` is added to `docs/03_database_design.md` §4's Collection Inventory as specified in §2 of this sheet. `docs/03` is to be updated with a Revision History entry citing ADR-0001. Migration-tracking implementation in `packages/database/migrations/run.ts` is authorized.
>
> Approved by: ______________________ (Principal Database Architect), date __________
> Approved by: ______________________ (Principal Software Architect), date __________

**Alternative dispositions:** *Rejected* (record reasoning so it is not silently re-litigated) or *Deferred* (set a named trigger — `docs/18` §6.3).

---

*No approval is claimed or implied by this sheet.*
