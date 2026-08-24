# ADR-0001 — Add the `schema_migrations` Tracking Collection to the Collection Inventory

| Field | Value |
|---|---|
| **Status** | **RECOMMENDED — HUMAN APPROVAL REQUIRED** |
| **Date drafted** | 2026-08-10 |
| **Status last reviewed** | 2026-08-11 — `implementation/01_sprint1_final_readiness_gate.md` |
| **Author** | Sprint 1 prerequisite remediation (AI-assisted session) |
| **Requires approval from** | Principal Software Architect + Principal Database Architect, via Architecture Review (`docs/11_engineering_workflow.md` §8.3, `docs/18_CLAUDE_CONSTITUTION.md` §6.3) |
| **Amends** | `docs/03_database_design.md` §4 (Collection Inventory) |
| **Cited by** | `docs/13_deployment_strategy.md` §5.6, §14; `docs/16_architecture_final_review.md` §8.3 item 3, §17; `docs/17_architecture_index.md` §12.1; `docs/18_CLAUDE_CONSTITUTION.md` §2.6 |

---

## Problem

`docs/13_deployment_strategy.md` §5.6 specifies that "the database itself carries a `schema_migrations` tracking collection... recording which migrations have been applied and when, so a deployment can programmatically verify 'is this database's schema state consistent with what this application version expects'".

That collection is **not** one of the 35 collections in `docs/03_database_design.md` §4's Collection Inventory. `docs/13` §14 flags this itself: it "should be formally added to that document's Collection Inventory (§4) via the ADR process... at implementation time, since it's a genuine (if small) schema addition this document identified but `03_database_design.md` remains the source of truth for."

`docs/18_CLAUDE_CONSTITUTION.md` §2.6 makes this binding: the gap "**MUST be formally closed via ADR before or during its first use, not silently implemented**."

Sprint 1's database foundation (`implementation/01_sprint1_identity_access.md` §3) is the first work that would create migrations — therefore the first use.

## Context

- Four separate locked documents (`13`, `16`, `17`, `18`) independently identify this as a known, tracked, low-severity gap with a named resolution mechanism (this ADR).
- `docs/16_architecture_final_review.md` §17 pre-authorizes the *shape* of the resolution: "Three items in this review's own findings should become formal ADRs early in implementation... None of these changes an approved architectural decision — each is a small, additive extension the ADR process exists precisely to handle."
- This is therefore an expected, anticipated ADR — not a novel architectural proposal.

## Options Considered

**Option 1 — Add `schema_migrations` to `03`'s Collection Inventory (recommended).**
Adds a 36th collection, holding deployment-tooling metadata only (no business data, no PII). Matches `docs/13` §5.6's design exactly. Enables the boot-time/pre-deploy schema-drift check `13` §5.6 wants and the `13` §10.2 release-checklist item "Recorded in the `schema_migrations` tracking collection".

**Option 2 — Track migration state outside MongoDB** (e.g. a file in the deploy artifact, or CI-side state).
Rejected: it decouples the record of "what schema state this database is in" from the database itself, so a database restored from backup (`docs/10` §10.6) would carry no indication of its own migration state — precisely the drift risk §5.6 exists to close.

**Option 3 — Rely on migration idempotency alone, with no tracking collection.**
`docs/13` §5.1 already requires every migration to be idempotent, so re-running the full set is safe. But this gives no programmatic answer to "is this database consistent with this application version" — it only makes getting it wrong non-destructive. It also leaves `13` §10.2's release-checklist item unsatisfiable. Rejected as a permanent answer; adopted only as the **interim** state while this ADR is unapproved (see Consequences).

## Proposed Decision

Adopt **Option 1**. Add `schema_migrations` to `docs/03_database_design.md` §4's Collection Inventory as a 36th collection with the following minimal shape:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `migrationId` | String | unique — matches the migration script's numeric prefix (`0001`, `0002`, …) |
| `description` | String | human-readable summary, copied from the migration |
| `category` | Enum | `index` \| `validator` \| `backfill` — `docs/13` §5.1's three change types |
| `appliedAt` | Date | |
| `appliedBy` | String | deploy actor/CI run identifier |
| `verifiedAt` | Date \| null | set once `docs/13` §5.5's post-migration validation passes |

Index: `{migrationId: 1}`, unique.

Classification: **not** business data, **no** PII (`docs/09_security_architecture.md` §1.4 Tier — none applicable), **no** soft delete (`docs/03` §3.1's soft-delete strategy does not apply; migration history is append-only and never removed).

## Consequences

**If approved:**
- `docs/03_database_design.md` §4 gains one row and a Revision History entry, per `docs/18` §5.1's "explained, logged remediation" pattern.
- The migration runner in `packages/database/migrations/` persists and reads migration state, closing `docs/13` §10.2's checklist item.

**Until approved (current state):**
- `packages/database/migrations/run.ts` deliberately **does not create or write to `schema_migrations`**. It relies solely on every migration being idempotent (`docs/13` §5.1), which is required regardless. The runner has one clearly-marked extension point where tracking is wired in once this ADR is approved.
- `docs/13` §10.2's "Recorded in the `schema_migrations` tracking collection" release-checklist item **cannot be satisfied** and must be treated as an open item on any release until then.
- This is recorded in `implementation/01_sprint1_prerequisite_remediation.md` §7 as a known, non-silent limitation.

## Source Documents

`docs/03_database_design.md` §3.1, §4; `docs/13_deployment_strategy.md` §5.1, §5.5, §5.6, §10.2, §14; `docs/16_architecture_final_review.md` §8.3, §17; `docs/18_CLAUDE_CONSTITUTION.md` §2.6, §5.1, §6.

## Status History

| Date | Status | Note |
|---|---|---|
| 2026-08-10 | PROPOSED | Initial draft during Sprint 1 prerequisite remediation |
| 2026-08-11 | **RECOMMENDED — HUMAN APPROVAL REQUIRED** | Re-reviewed against `docs/03`, `docs/13`, `docs/16`, `docs/18`. Evidence continues to support Option 1; no alternative is required by the locked documents. **Status raised to RECOMMENDED, not Approved:** `docs/18` §6.3 vests approval in a scheduled Architecture Review by named human roles, and no such mechanism is available in this repository (CODEOWNERS carries placeholder `@nfi-org/*` handles, no GitHub organisation exists, nothing has been pushed to a remote). Per `docs/18` §6.4, **no dependent implementation may be written** — the migration runner therefore still creates no tracking collection. |

## What Approving This ADR Would Change (added 2026-08-11, status unchanged)

Recorded so the approver sees the exact blast radius. **None of this is implemented.**

| # | Change | File |
|---|---|---|
| 1 | Create and write the `schema_migrations` collection (`migrationId`, `description`, `category`, `appliedAt`, `appliedBy`, `verifiedAt`) | `packages/database/migrations/run.ts` — the marked EXTENSION POINT |
| 2 | Skip already-applied migrations instead of re-running all of them | same |
| 3 | Add the collection to the Collection Inventory + a Revision History entry citing this ADR | `docs/03_database_design.md` §4 (locked — `docs/18` §5.1) |
| 4 | Add runner tests: first run, second run, partial-failure recovery, duplicate execution | new test file |
| 5 | Satisfy the release-checklist item that is currently unsatisfiable | `docs/13` §10.2 |

### Current safety mechanism, re-verified 2026-08-11

**Idempotency is the ONLY safeguard**, because the runner records nothing and re-applies all five migrations on every run. That property was **broken** at Sprint 1 closure (migration `0001` re-asserted an index spec that `0005` had corrected, failing with `IndexKeySpecsConflict` and aborting the suite before `0002`–`0005` ran) and has been **fixed and re-verified independently**:

- fresh database, run 1 → all 5 applied and verified;
- run 2 → all 5 applied and verified, no changes;
- run 3 → all 5 applied and verified (duplicate execution safe);
- final `uniq_phone_active` filter is `0005`'s corrected `{isDeleted:false, phone:{$type:"string"}}`;
- `0004` no-ops without env vars — no default account is created;
- `schema_migrations` confirmed **absent** from the database.

This is working as designed, but it is a **single point of failure**: correctness depends on every future migration author preserving idempotency by hand, with nothing in CI to catch a regression. Removing that fragility is this ADR's purpose. **The fix reduces the urgency; it does not resolve the ADR.**

### Correction to an earlier statement in this document

The Status History row below states "nothing has been pushed to a remote". Re-verified 2026-08-11: a remote **is** configured (`origin`), but `git ls-remote --heads origin` returns **nothing** — the repository is empty and no branch tracks it. The remote is a **personal** GitHub account, not an organisation, so `CODEOWNERS`' `@nfi-org/*` team handles still cannot resolve. The conclusion is unchanged; the detail is now accurate.

## Approval

- [ ] Circulated to Principal Software Architect and Principal Database Architect
- [ ] Architecture Review discussion held (`docs/11_engineering_workflow.md` §8.3)
- [ ] Outcome recorded: Approved / Rejected / Deferred
- [ ] If Approved: `docs/03_database_design.md` §4 updated with a Revision History entry citing this ADR

**No implementation depending on this ADR may be written until the boxes above are checked** (`docs/18_CLAUDE_CONSTITUTION.md` §6.4).
