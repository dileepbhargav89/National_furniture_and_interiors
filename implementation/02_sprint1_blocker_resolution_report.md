# Sprint 1 Blocker Resolution Report

**Date:** 2026-08-11
**Phase:** Governance + architecture + readiness resolution. **Not** Sprint 1 implementation.
**Repository:** `D:/Projects/Client Projects/Nationalinteriors`

---

## 1. Executive Summary

Every blocker that engineering could resolve has been resolved. Every blocker that requires a human decision has been analysed to the evidentiary standard `docs/18` §6.2 demands, packaged into decision sheets with exact approval statements, and consolidated into a single Architecture Review pack.

**Nothing was approved. Nothing was guessed. No locked document was modified. No business module was implemented.**

The verdict is unchanged from the previous gate — **NOT READY** — but the character of the remaining work has changed materially. Previously the blockers were *unanalysed*; now they are *decided-but-unapproved*. Six of seven items carry a specific, evidence-backed recommendation. The seventh (IaC) deliberately carries none, because `docs/18` §6.2 reserves that judgement for the CTO.

**One structural finding stands out:** the role→permission gap is not a defect in the migration — it is a genuine gap in the locked baseline. `docs/02` §14's role table is organised by **business module**, while Phase-1's permission keys are `auth`/`users`/`admin` — an axis that table never addresses. That is why 36 of 42 cells cannot be resolved from evidence.

---

## 2. Blockers Found

| ID | Blocker | Origin |
|---|---|---|
| B1 | ADR-0002 — privileged-account provisioning | Prior gate; **security-critical** |
| B2 | Role→permission matrix — 36/42 cells | Prior gate; **security-critical** |
| B3 | ADR-0003 (IaC) + Shared Development | Prior gate |
| B4 | ADR-0001 — `schema_migrations` | Prior gate |
| B5 | Turbo typecheck/build race | Prior gate |
| B6 | Rate-limit package governance | Prior gate |

All six re-verified against the live repository this session. **No new blocker was discovered**, and no prior finding was overturned.

---

## 3. Blockers Resolved Technically

Everything achievable inside the repository is complete:

| Work | Result |
|---|---|
| Repository state re-audit (12 checks) | ✅ VERIFIED — prior report accurate on all counts |
| Locked-document integrity | ✅ VERIFIED via `git diff` **and** commit history (status `A` only) |
| Turbo race — 4-scenario reproduction | ✅ Clean 23/23 · Stale **FAIL** · Fix+stale 23/23 · Repeat 23/23 |
| Turbo fix compatibility vs `docs/05` §14.1, `docs/07`, `docs/06` §9, `docs/12` §9 | ✅ VERIFIED compatible |
| Permission-key extraction | ✅ 29 keys, mechanically extracted, **0 invented** |
| Rate-limit governance evidence | ✅ Decisive precedent found (§8) |
| IaC comparative analysis | ✅ 4 tools × 12 constraints, weighted |
| Full verification suite | ✅ 20/20 tests · 23/23 tasks · 6-service Docker stack healthy |
| Seven decision documents authored | ✅ Complete |

**Nothing further can be resolved by engineering.**

---

## 4. Decisions Still Requiring Human Approval

| # | Decision | Recommendation | Approver | Blocks |
|---|---|---|---|---|
| 1 | ADR-0002 — privileged registration | **Option A** — `CUSTOMER` only | Principal Security Architect | `RegisterUser`; acceptance criterion |
| 2 | RBAC matrix — Q1–Q10 | **No blanket rec.** 4 need answers, 3 need confirmation | Principal Security Architect | RBAC acceptance testing |
| 3 | ADR-0001 — `schema_migrations` | **Option 1** — approve | Principal Database Architect | `docs/13` §10.2 checklist |
| 4 | Rate-limit packages | **Implementation detail — retain** | Principal Software Architect | Nothing |
| 5 | ADR-0003 — IaC tool | **None — deliberately** | **CTO** | Shared Dev provisioning |
| 6 | Shared Dev path A or B | **B now, A in parallel** *(sequencing only)* | Engineering Director | DoD for every Story |
| 7 | Turbo fix merge | **Merge** | Principal DevOps Architect | CI trustworthiness |

Consolidated for a real meeting in `implementation/02_architecture_review_pack.md`.

---

## 5. ADR Status

| ADR | Status | Change this session |
|---|---|---|
| **0001** `schema_migrations` | **RECOMMENDED — HUMAN APPROVAL REQUIRED** | Raised from PROPOSED (permitted by the task's conditional; **not** an approval). Status History section added recording *why* it cannot be Approved |
| **0002** privileged provisioning | **PROPOSED — NOT APPROVED** | Unchanged. `RegisterUser` remains BLOCKED |
| **0003** IaC tooling | **PROPOSED — NOT APPROVED** | Unchanged. Supporting-analysis pointer added; **no tool selected** |

**Zero ADRs approved.** `docs/18` §6.3 vests approval in a scheduled Architecture Review by named human roles; **no such mechanism exists here** — CODEOWNERS carries self-documented placeholder `@nfi-org/*` handles, no GitHub organisation exists, nothing has been pushed. Marking any ADR Approved would fabricate governance.

---

## 6. RBAC Status

**OPEN — HUMAN DECISION REQUIRED.**

| Metric | Value |
|---|---|
| Phase-1 keys defined | 6 of 6 ✅ |
| Keys platform-wide | 29, all explicit, **0 invented** |
| **Cells resolved** | **6 of 42 (14%)** — `SUPER_ADMIN` only |
| Cells OPEN | 36 |
| Structural questions resolved by evidence | 3 (C, F, G) |
| Questions needing decision | 4 (A, B, E, and D's audit-log half) |
| **Guessed grants** | **0** |
| Migration `0002` changed | **No** |

**Two inferences explicitly rejected:**
- **`SUPPORT_AGENT` → `users.read`** from "Customers (read)". Wrong on the documents' own terms: `customers` is a **`crm`** collection (`docs/03` §9.7.1, which states it "references `auth`'s `users` by ID only, never duplicates identity data"), and `docs/08` §8 already supplies `crm.read` for it. The wrong mapping would have exposed **every staff and admin identity record**.
- **`CUSTOMER` → `users.read_self`** from "(implicit for own profile)" — genuinely ambiguous between "must be granted" and "inherent to any authenticated principal". Left OPEN as Q1, the highest-leverage question in the pack.

**Enforcement model confirmed (Q-G):** `roles.permissionIds[] → permissions.key` remains the sole source of truth (`docs/03` §9.1.2–9.1.3; `docs/02` §14 explicitly labels its own table a non-enforcing summary).

---

## 7. Turbo Status

**CONFIRMED defect · fix validated · NOT merged.**

| Scenario | Result |
|---|---|
| Clean `.next/` | ✅ 23/23 |
| Stale `.next/`, no fix | ❌ **FAIL** — `TS6053`, exit 2 |
| Stale + candidate fix | ✅ 23/23 |
| Repeated with fix | ✅ 23/23 |

Cumulative across sessions: **4/4 failures** with the precondition, **0/2** clean — deterministic given a stale `.next/`, not intermittent. Both Next.js apps affected.

**Root cause:** `tsconfig.json` includes `.next/types/**` while root `turbo.json` gives `typecheck` only `^build` (upstream), so `typecheck` and `build` race within the same package as `next build` regenerates those types.

**Fix:** two 9-line per-package `turbo.json` files. Root config untouched. Verified compatible with `docs/05` §14.1 (whose requirement is conditional and package-scoped by its own wording), `docs/07` (native Turborepo 2.x feature — no new technology), `docs/06` §9, and `docs/12` §9.

**Current state:** reverted. `ls apps/*/turbo.json` = **0 files**.

---

## 8. Rate-Limit Dependency Status

**RECOMMENDED — RETAIN. Confirmation required. Repository unchanged.**

The capability is locked in four places (`docs/02` §16; `docs/07` §4.2, §7.1; `docs/08` §4.4). The **package** is named nowhere — and neither are several others.

**Decisive precedent found this session:** `ioredis` and `jsonwebtoken` have **zero mentions** in `docs/07`, and `cors` is not named as a package lock — yet **all three shipped in the original Sprint 0 scaffold** (verified against commit `56e24bf`). The baseline's own established practice is that locked documents name the **capability**; the npm package implementing it is an implementation-detail choice. `docs/07` §6.1 states this directly for JWT: *"The JWT library itself follows Section 1.1"*.

Requiring an ADR for `express-rate-limit` would, for consistency, retroactively require one for `ioredis`, `jsonwebtoken`, and `cors`. **The reviewer may overrule this reading; if so, both packages must be removed pending an ADR.**

One genuine open risk flagged: **fail-closed behavior on Redis-store failure is unverified.** `docs/09` §2.2 argues a limiter-store error should deny, not allow. Must be tested in Sprint 1.

---

## 9. IaC Status

**PROPOSED — CTO DECISION REQUIRED. No tool selected by AI. No dependency added. No infrastructure provisioned. 0 IaC files exist.**

Analysis narrows without deciding:
- **AWS CDK (169) / CloudFormation (151)** score poorly **for this architecture specifically** — `docs/10` §9.4 (**MongoDB Atlas**) and `docs/07` §19.1 (**Vercel**) are locked and neither tool covers them, leaving three of five providers outside version control, against `docs/10` §2.2.
- **Terraform (222) vs OpenTofu (223)** — a 1-point gap is **not technically decisive**.

The two real judgements are **not technical**: (i) licensing, BUSL-1.1 vs MPL-2.0 — a legal question; (ii) multi-provider coverage vs. **no state file to secure** — a genuine security trade-off under `docs/09` §5.1, and the one dimension on which the eliminated options remain attractive.

---

## 10. Shared Development Status

**NOT PROVISIONED. NO TEMPORARY EXCEPTION EXISTS.**

Two independent blockers: the IaC decision (§9), and cloud accounts/credentials that are external to this repository entirely (no AWS CLI, no credentials, nothing pushed).

**Definition-of-Done impact — the most consequential open item.** `docs/11` §7.2 requires "Deployed to Shared Development" for every Story; `docs/13` §2.2 forbids skipping stages. **No Sprint 1 Story can currently be marked Done.**

Option A (provision) and Option B (time-boxed DoD exception) are both legitimate. **Option C — mark Stories Done anyway — is PROHIBITED** (`docs/18` §7 Rule 4) and is the realistic default if this is left undecided rather than decided.

---

## 11. Locked Document Integrity

✅ **VERIFIED — `docs/01` through `docs/18` are byte-for-byte unmodified.**

Two independent proofs:
1. `git diff` across all 18 files → **empty**.
2. Commit history → every locked doc carries status `A` (added) in the initial commit `56e24bf` and appears in **no** later commit's change set.

Only `docs/adr/` files were added or modified — a sanctioned location (`docs/06` §8, `docs/18` §2.12).

---

## 12. Repository Integrity

| Check | Result |
|---|---|
| Business modules | ✅ **0 `.ts` files** in `apps/api/src/modules/` |
| Dependency drift this session | ✅ **None** — `git diff` on manifests and lockfile empty |
| IaC files | ✅ **0** |
| `turbo.json` overrides | ✅ **0** — fix reverted |
| Migrations altered to fit tests | ✅ **No** — `0002` unchanged |
| Cloud infrastructure | ✅ **None provisioned** |
| Tests | ✅ 20/20 |
| Lint / Typecheck / Build | ✅ 23/23 tasks from clean state |
| Docker stack | ✅ 6 services; `/health` 200, `/ready` 200 both connected |
| Working tree | ✅ Auditable — 2 modified ADRs, 12 new governance documents, nothing else |
| Committed? | ❌ **No** — per instruction |

---

## 13. Sprint 1 Entry Criteria

Full 21-item checklist: `implementation/02_sprint1_entry_gate.md`.

**7 verified · 2 partial · 12 blocked or open.**

All seven verified criteria are the engineering surface (locked-doc integrity, auditable tree, tests, lint, typecheck, build, Docker). All twelve unmet criteria are governance decisions.

---

## 14. Final Verdict

# NOT READY

**`READY WITH EXTERNAL DEPENDENCY` was explicitly considered and rejected.** Its definition requires that no application implementation be blocked by an unresolved security/architecture decision. Two such blockages remain, and both are **internal**, not external:
- ADR-0002 blocks `RegisterUser`
- The RBAC matrix blocks acceptance testing beyond `SUPER_ADMIN`

**This status becomes correct the moment Architecture Review items 1–4 and 7 are approved and only Shared Development remains.** That is the realistic next milestone, and it is one meeting away.

**Technical readiness is achieved; governance readiness is not.** The foundation working is not evidence that Sprint 1 may open.

---

## 15. Exact Next Action

### Convene one Architecture Review — Session 1 (~35 minutes)

**WHO:** Principal Security Architect *(required)*, Principal Software Architect, Principal Database Architect.

**WHAT they must decide:**
1. **ADR-0002** — approve Option A (public register = `CUSTOMER` only)?
2. **RBAC Q1** — is `users.read_self` an explicit grant or inherent? *(resolves 7 cells)*
3. **RBAC Q2–Q4** — do any staff roles hold `users.read` / `users.write` / `admin.view_audit_log`?
4. **RBAC Q5–Q7** — confirm `auth.manage_mfa` and `admin.manage_roles` are `SUPER_ADMIN`-only, and that `SUPPORT_AGENT` gets `crm.read`, not `users.read`.
5. **ADR-0001** — approve `schema_migrations`?
6. **Rate-limit packages** — implementation detail, or ADR required?

**WHY it matters:** without #1, an anonymous caller's ability to self-assign `STAFF` is undefined — and the literal reading of `docs/15` §3.1 would permit it, nullifying MFA, RBAC, and admin network hardening at once. Without #2–#4, six of seven roles hold zero permissions and the Phase 1 acceptance criterion cannot be demonstrated except by making the test account `SUPER_ADMIN`, which defeats its purpose.

**WHAT becomes unblocked:** `RegisterUser`; the full `auth` module; RBAC acceptance testing; migration `0003` applying agreed grants; `docs/13` §10.2's release checklist. Status advances to **READY WITH EXTERNAL DEPENDENCY**.

### Session 2 (~25 minutes)

**WHO:** CTO + Engineering Director + Principal DevOps Architect.
**WHAT:** ADR-0003 (IaC tool + whether it blocks Sprint 1 scope) and the Shared Dev / DoD decision (Option A or B).
**WHY:** without the DoD decision, Sprint 1 produces Stories that cannot be closed — and someone under delivery pressure marks them Done anyway, which is prohibited.
**UNBLOCKS:** Shared Development provisioning; a legitimate DoD for Sprint 1. Status advances to **READY**.

### Independent

**WHO:** Principal DevOps Architect. **WHAT:** approve the two-file turbo fix as a standalone PR. **WHY:** CI is currently non-deterministic; Sprint 1 raises PR volume sharply.

---

*This report approves nothing, implements nothing, provisions nothing, and modifies no locked document. Sprint 1 implementation has not begun and must not begin while this verdict reads NOT READY.*
