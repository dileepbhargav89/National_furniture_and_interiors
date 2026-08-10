# ADR-0001 — Add the `schema_migrations` Tracking Collection to the Collection Inventory

| Field | Value |
|---|---|
| **Status** | **PROPOSED — NOT YET APPROVED** |
| **Date drafted** | 2026-08-10 |
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

## Approval

- [ ] Circulated to Principal Software Architect and Principal Database Architect
- [ ] Architecture Review discussion held (`docs/11_engineering_workflow.md` §8.3)
- [ ] Outcome recorded: Approved / Rejected / Deferred
- [ ] If Approved: `docs/03_database_design.md` §4 updated with a Revision History entry citing this ADR

**No implementation depending on this ADR may be written until the boxes above are checked** (`docs/18_CLAUDE_CONSTITUTION.md` §6.4).
