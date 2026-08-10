# Sprint 1 — Architecture Decision Review

**Date:** 2026-08-11
**Purpose:** Focused review of the five unresolved items blocking the Sprint 1 readiness gate. **Analysis and recommendation only** — no ADR status was changed, no option implemented, no infrastructure provisioned, no business module built.
**Governing rule:** `docs/18_CLAUDE_CONSTITUTION.md` §6 (ADR process), §7 (AI Operating Rules — Rule 3 "never invent architecture", Rule 6 "ask for an ADR, don't decide").
**Reviewed:** `docs/01`–`18`; `implementation/00_foundation_setup.md`; `implementation/01_sprint1_identity_access.md` (v1.2); `implementation/01_sprint1_prerequisite_remediation.md`; `docs/adr/0001`, `0002`, `0003`.

> **Authority note.** This document is a *review prepared for* the approving roles named per item. `docs/18` §6.3 vests approval in the Architecture Review, and §6.4 forbids adoption-by-implementation. Nothing here is adopted.

---

## 1. ADR-0001 — `schema_migrations` Tracking Collection

### Problem
`docs/13_deployment_strategy.md` §5.6 requires a `schema_migrations` collection recording which migrations have been applied, so a deployment can programmatically answer "is this database's schema state consistent with what this application version expects". It is not among `docs/03_database_design.md` §4's 35 collections.

### Existing architectural requirement
- `docs/13` §5.6 — specifies the collection and its purpose.
- `docs/13` §14, `docs/16_architecture_final_review.md` §8.3 item 3 / §17, `docs/17_architecture_index.md` §12.1 — four documents independently flag it as a known, tracked gap with a named resolution path.
- **`docs/18_CLAUDE_CONSTITUTION.md` §2.6 — binding:** "MUST be formally closed via ADR **before or during its first use**, not silently implemented."
- `docs/13` §10.2 — release checklist contains "Recorded in the `schema_migrations` tracking collection".

### Options
| # | Option | Assessment |
|---|---|---|
| 1 | Add `schema_migrations` to `docs/03` §4 as a 36th collection (deployment-tooling metadata; no PII; append-only; unique index on `migrationId`) | **Recommended.** Matches `docs/13` §5.6 exactly; smallest possible change |
| 2 | Track state outside MongoDB (artifact file / CI-side) | Rejected — a database restored from backup (`docs/10` §10.6) would carry no record of its own migration state, which is the exact drift `§5.6` exists to prevent |
| 3 | Rely on idempotency only, no tracking | Rejected as permanent; **currently in force as the interim state** |

### Security impact
**Negligible.** No PII (`docs/09_security_architecture.md` §1.4 — no tier applies), no credentials, no business data. Minor positive: an auditable record of schema changes supports incident forensics (`docs/09` §12.4's "Assess" step).

### Operational impact
**Currently negative.** `docs/13` §10.2's release-checklist item is **unsatisfiable**, so no release can honestly complete that checklist. Migration safety today rests entirely on idempotency — proven (two consecutive runs left all counts unchanged) but unverifiable *by inspection*: an operator cannot ask the database what state it is in.

### Development impact
Low. One collection, one index, ~15 lines at the runner's already-marked extension point.

### Recommended decision
**Approve Option 1.** `docs/16` §17 already anticipates this as an ADR expected "early in implementation".

### Consequences
- **If approved:** `docs/03` §4 gains one row + Revision History entry (`docs/18` §5.1's pattern); runner records applied migrations; `docs/13` §10.2 becomes satisfiable.
- **If not approved:** interim state persists; every release carries an unsatisfiable checklist item.

### Blocks Sprint 1?
**No — with one caveat.** Module development is unaffected. It blocks *release-checklist completeness*, which matters at the Sprint 1 → Phase 2 boundary, not during implementation.

### Required approval authority
Principal Database Architect (owns `docs/03` per `docs/17` §8) **+** Principal Software Architect, via Architecture Review (`docs/11` §8.3).

---

## 2. ADR-0002 — Privileged-Account Provisioning

### Problem
`docs/15_master_project_plan.md` §3.1's Phase 1 acceptance criterion says a `STAFF` account "**can register**". `docs/08_api_architecture.md` §8's `auth` row makes `POST /auth/register` **unauthenticated**. **No locked document constrains which `userType` an anonymous caller may request.** Read together, an anonymous caller could self-assign `userType: STAFF`.

### Existing architectural requirement
- `docs/03` §9.1.1 — `userType` enum `CUSTOMER` | `STAFF` | `ADMIN`; says nothing about who sets it.
- `docs/09` §2.2 — **fail-closed principle**: ambiguity resolves to denial, never default-allow.
- `docs/09` §1.12 — Admin is "the highest-value target on the platform by privilege level".
- `docs/09` §2.8 — precedent: lost-MFA recovery requires "identity re-verification by a `SUPER_ADMIN`", explicitly **not** self-service, because "self-service MFA reset is a well-known bypass vector".
- `docs/02` §14 — `SuperAdmin` holds User & Role Management.
- `docs/08` §8 `users` row — `/admin/users` exists as an authenticated admin surface with `users.write` for "admin, any user".
- `docs/18` §8 — "Do not bypass RBAC."

### Determination requested: may public registration ever select `STAFF` or `ADMIN`?

**Reviewer finding: No.** Not on the basis of preference, but because every locked control that touches privileged identity points the same way: `docs/09` §2.2 (fail-closed), §1.12 (highest-value target), §2.8 (privileged identity changes are `SUPER_ADMIN`-mediated, never self-service), and `docs/02` §14 (User Management is a `SuperAdmin` capability). A self-service path to `STAFF` would nullify all four simultaneously. Absent an explicit locked statement permitting it — and there is none — `docs/09` §2.2 requires the closed reading.

**This remains a recommendation. `docs/18` §6.3 reserves the decision for the Architecture Review.**

### Options

**Option A — Public register creates `CUSTOMER` only; privileged accounts provisioned by `SUPER_ADMIN`.**
`POST /auth/register` does not accept `userType`/`roleId` at all (strict-mode Zod rejects them per `docs/08` §3.12, satisfying the mass-assignment control in `docs/09` §3.10 / Rule 7). `STAFF`/`ADMIN` created via `POST /admin/users`. First `SUPER_ADMIN` bootstrapped by migration (`docs/13` §5.4's reference-data exception).
*Uses only surfaces that already exist in `docs/08` §8. No new endpoint, no new state machine.*

**Option B — Controlled `STAFF` invitation/provisioning flow.**
`SUPER_ADMIN` issues a time-boxed invitation token; invitee completes their own credential setup via a dedicated endpoint.
*Assessment:* better onboarding UX and avoids an admin ever handling a temporary password. **But** it requires a new endpoint, a new token collection with TTL, a new email template, and invitation state — **none of which appear in `docs/03`'s 35 collections or `docs/08` §8's contract table.** Adopting it is a genuine architecture extension requiring its own ADR *in addition* to this one. Recommend as a **post-MVP enhancement**, explicitly deferred with a trigger, not Phase 1 scope.

**Option C — Other architecture-supported approaches considered.**
| C-variant | Verdict |
|---|---|
| Register accepts `userType`, privileged ones enter a pending-approval queue | Rejected — invents an approval workflow no locked document describes; strictly more surface than B for the same outcome |
| Domain-allowlist auto-elevation (e.g. `@nationalinteriors.*` → `STAFF`) | **Rejected on security grounds.** Email-domain control is not an authentication factor; contradicts `docs/09` §2.2 |
| Separate hidden staff-registration endpoint | **Rejected.** Security-through-obscurity; contradicts `docs/09` §1.12's threat posture |
| Implement `docs/15` §3.1 literally (anonymous `userType: STAFF`) | **Rejected outright** — the privilege-escalation hole under Problem; direct `docs/18` §8 violation |

### Security impact
**This is the single highest-severity item in this review.** Option A closes an unbounded privilege-escalation path. Any option permitting anonymous privileged registration would make MFA (`docs/09` §2.8), permission-key RBAC (`docs/02` §14), and admin network hardening (`docs/09` §1.12) simultaneously worthless — an attacker would simply enrol their own MFA on a self-created `STAFF` account.

### Operational impact
Option A requires a documented bootstrap procedure for the first `SUPER_ADMIN` (migration-based) and an admin runbook for staff onboarding. Modest, and both are already implied by `docs/13` §5.4.

### Development impact
Option A is the **least** development work of any option — it *removes* fields from the register payload and reuses `POST /admin/users`, which `docs/08` §8 already specifies. Options B/C all add surface.

### Recommended decision
**Approve Option A for Phase 1.** Record Option B as a deferred enhancement with a named trigger (`docs/07`'s trigger-based-deferral pattern), to be raised as its own ADR if/when staff-onboarding volume justifies it.

### Consequences
- **If approved:** `RegisterUser` becomes implementable; `docs/08` §8's `auth` row gains a clarifying note + Revision History entry; `implementation/01_sprint1_identity_access.md` §11's acceptance-test step 1 converts from provisional to confirmed.
- **If not approved / deferred:** `RegisterUser` stays blocked. Note the six other `auth` use cases are **not** blocked.
- **If rejected in favour of B:** Phase 1 scope grows by one collection + one endpoint + one notification path, all requiring their own ADR.

### Blocks Sprint 1?
**Yes — partially and precisely.** Blocks `RegisterUser` only. `LoginUser`, `RefreshToken`, `LogoutUser`, `SetupMfa`, `VerifyMfa`, password-reset, all of `users`, and all of `admin` are unblocked. It also blocks the *milestone*: `docs/15` §3.1's acceptance sentence cannot be demonstrated end-to-end until a `STAFF` account can legitimately exist.

### Required approval authority
**Principal Security Architect** (primary — owns the Security domain per `docs/17` §8) **+** Principal Software Architect. Per `docs/09` §12.3 and `docs/11` §4.7, any change touching auth requires security review; this is the design-level instance of that rule.

---

## 3. ADR-0003 — IaC Tooling for Shared Development

### Problem
`docs/10_devops_architecture.md` §3.2 defines Shared Development as real cloud infrastructure (ECS Fargate, MongoDB Atlas `M0`-equivalent, Redis), auto-deployed on merge to the default branch. **No locked document names an Infrastructure-as-Code tool.** Verified: `docs/07_technology_decision_record.md` has no IaC category across its 19 categories; `docs/10` §9 (Infrastructure) and §19 (Open Items) name none.

### Existing architectural requirement
- `docs/10` §2.2 — "configuration is data"; **no direct environment edit outside version control** (repeated as a gate in `docs/18` §3). This rules out console click-ops as the durable answer.
- `docs/10` §9.2 / §9.4 — AWS ECS Fargate and MongoDB Atlas are the locked targets.
- `docs/13` §2.2 — Local → Shared Development is the first mandatory promotion step; no stage may be skipped.
- `docs/11` §7.2 — every Story's DoD includes "Deployed to Shared Development".
- `docs/18` §2.4 — no technology may be introduced without an ADR carrying `docs/07`-grade alternatives analysis.

### Options — evaluated against the locked architecture only

| Dimension | **Terraform / OpenTofu** | **AWS CDK** | **CloudFormation** |
|---|---|---|---|
| Covers ECS Fargate (`docs/10` §9.2) | Yes | Yes | Yes |
| Covers **MongoDB Atlas** (`docs/10` §9.4) | **Yes** — official Atlas provider | Partial — needs a third-party construct or the Atlas CFN resources | Partial — via Atlas's CFN resource types |
| Covers Vercel (`docs/10` §8.2, `docs/07` §19.1) | Yes — community/official provider | No | No |
| Multi-provider in one tool | **Yes** — the decisive differentiator here, since this platform is deliberately multi-cloud (AWS + Atlas + Cloudinary + Vercel + Razorpay) | AWS-centric | AWS-only |
| Language | HCL (declarative) | TypeScript — matches `docs/07` §4.3's locked language | JSON/YAML |
| State management | External state backend required (operational burden) | Managed by CFN | Managed by AWS |
| Team learning curve | New DSL | **Lowest** — same TypeScript the team already writes | Verbose; lowest ergonomics |
| Fit with `docs/07` §1's "match the tool to the team's stage" | Strong | Strong on language, weak on multi-provider | Weak |

**Reviewer observation (not a decision):** the deciding constraint is **MongoDB Atlas + Vercel**, not AWS. This platform's infrastructure is not AWS-only, so an AWS-native tool leaves two of the locked providers outside IaC — which would partially defeat `docs/10` §2.2. That materially favours Terraform/OpenTofu. Set against it: CDK's TypeScript alignment with `docs/07` §4.3 is a real advantage for a small team.

**No recommendation is issued.** `docs/18` §6.2 requires the same alternatives rigor `docs/07` applied to every locked choice — including performance, security, scalability, migration strategy, version policy, and operational-risk sections this review is not the right instrument to produce. That is the CTO's and Principal DevOps Architect's work.

### Security impact
Indirect but real. Without IaC, Shared Development would be built by hand — meaning security-group rules, IAM policies, and network isolation (`docs/09` §5–§6, `docs/10` §2.5) would exist only as undocumented console state, unreviewable and undiffable. **Also note:** `docs/09` §1.12 requires admin network hardening (VPN/IP-allowlist) to be "non-optional in production" — that control needs an IaC home.

### Operational impact
**Currently blocking.** Shared Development cannot be built. Knock-on: `docs/11` §7.2's DoD line is unsatisfiable for every Story in every Sprint until resolved.

### Development impact
None on module code. Full impact on the definition of "done".

### Recommended decision
**Escalate, do not decide.** Recommended sequencing: (1) CTO + Principal DevOps Architect select a tool with `docs/07`-grade analysis; (2) add it to `docs/07` as a new category via ADR; (3) provision Shared Development; (4) implement `deploy-staging.yml`.

**Separately and urgently:** decide how Sprint 1 Stories close their DoD in the interim. Either amend `docs/11` §7.2 for the pre-Shared-Dev period (itself an ADR against a locked document), or accept that no Story can be fully Done. **This must not be left implicit** — it is currently the single most likely thing to be silently ignored.

### Consequences
- **If resolved:** Shared Dev provisioned; promotion path (`docs/13` §2.2) becomes real.
- **If unresolved:** Sprint 1 can produce merged, tested, locally-verified code that **cannot** satisfy its own Definition of Done.

### Blocks Sprint 1?
**Does not block implementation. Blocks Definition of Done.** Code can be written, reviewed, tested, and merged; it cannot be legitimately marked Done under `docs/11` §7.2.

### Required approval authority
**CTO** (owns Technology per `docs/17` §8) **+ Principal DevOps Architect** (owns DevOps/Deployment). The DoD-amendment question additionally requires the **Engineering Director** (owns `docs/11`).

---

## 4. Phase-1 Role → Permission Matrix

### Problem
Migration `0002-identity-reference-data` seeds 7 roles and 6 Phase-1 permission keys, but grants keys **only** to `SUPER_ADMIN`. The other six roles hold zero permissions. This was deliberate (fail-closed), but it is an unresolved decision, not a final state.

### Existing architectural requirement
- `docs/02` §14 — role table, explicitly "a human-readable summary of which permission keys each role is granted", **not** the enforcement mechanism.
- `docs/03` §9.1.2–9.1.3 — `roles.permissionIds[]` / `permissions.key` are the enforcement source of truth.
- `docs/09` §2.4 — `<module>.<action>` taxonomy; no bare module-name grants.
- `docs/09` §2.2 — fail-closed.
- `docs/09` §2.3 — least-privilege review cadence.

### Explicitly defined permissions (extracted from `docs/01`–`18`; none invented)

**29 permission keys are explicitly named across the locked documents.** Phase-1-relevant subset (the `auth`/`users`/`admin` modules, from `docs/08` §8):

| Key | Source |
|---|---|
| `auth.manage_mfa` | `docs/08` §8 `auth` row — "admin-forced MFA reset" |
| `users.read_self` | `docs/08` §8 `users` row — "implicit for own profile" |
| `users.read` | `docs/08` §8 `users` row — "(admin, any user)" |
| `users.write` | `docs/08` §8 `users` row — "(admin, any user)" |
| `admin.manage_roles` | `docs/08` §8 `admin` row |
| `admin.view_audit_log` | `docs/08` §8 `admin` row |

*(The remaining 23 belong to modules not yet built — `leads.*`, `crm.*`, `design_projects.*`, `catalog.write`, `cart.*`, `orders.*`, `payments.read`, `reviews.*`, `media.*`, `notifications.read`, `cms.write`, `analytics.read` — and are correctly **not** seeded. `docs/09` §11 rule 6 governs each as its own module is built.)*

### Role mappings explicitly defined

| Role | Phase-1 keys explicitly granted | Source |
|---|---|---|
| `SUPER_ADMIN` | All six | `docs/02` §14 "Full access, including User & Role Management"; `docs/08` §8 `admin` row "`SuperAdmin`-only" |

**That is the complete list.** One role of seven.

### Role mappings missing

| Role | What `docs/02` §14 says | Phase-1 keys specified |
|---|---|---|
| `SALES_MANAGER` | "Leads module, read-only Design Projects and Orders" | **None** — describes only not-yet-built modules |
| `DESIGN_MANAGER` | "Design Projects (full), Leads (read/assign), Media" | **None** — same |
| `DESIGNER` | Own assigned projects only | **None** — same |
| `CATALOG_MANAGER` | "Catalog, Inventory, Marketing" | **None** — same |
| `SUPPORT_AGENT` | "Orders (read + limited actions), Customers (read)" | **None** — same |
| `CUSTOMER` | Storefront customer | **None specified**, though `users.read_self` is strongly implied by `docs/08` §8's "implicit for own profile" |

**Structural finding:** `docs/02` §14's table is organised around *business modules*, while Phase 1's permission keys are `auth`/`users`/`admin` — an axis the table never addresses. This is not an oversight in the migration; it is a genuine gap in the locked baseline. The most consequential specific unknown: **does any role other than `SUPER_ADMIN` hold `users.read` / `users.write`?** A `SUPPORT_AGENT` who must "view customers" plausibly needs `users.read` — but `docs/02` §14 says "Customers (read)", and `customers` is a `crm` collection (`docs/03` §9.7.1), *not* `users`. Inferring `users.read` from that sentence would be inventing an authorization grant.

### Security consequence of missing mappings
**Currently safe, and deliberately so.** Every unspecified grant is absent, which is exactly `docs/09` §2.2's fail-closed requirement. The risk is **not** over-permission; it is:
1. **Functional dead-end at acceptance time.** `implementation/01_sprint1_identity_access.md` §11's acceptance step 7 requires a non-`SUPER_ADMIN` role to be denied a route it lacks permission for — that still works. But step 11 (a role *with* `users.read` succeeding) cannot be demonstrated by any role except `SUPER_ADMIN`.
2. **Pressure to guess under deadline.** The real hazard is an implementer silently adding grants mid-sprint to make a test pass. `docs/09` §11 rule 6 and `docs/18` §7 Rule 3 forbid this, but the gap creates the incentive.
3. **`SUPER_ADMIN` over-use.** With only one functional role, testing and early operations will lean on the highest-privilege account — contrary to `docs/09` §2.3's least-privilege posture.

### Recommended governance action
1. **Decide the six Phase-1 mappings explicitly** at the same Architecture Review as ADR-0002 (same approver, same domain). Six roles × six keys — a bounded, one-sitting decision.
2. **Record the outcome as an ADR** amending `docs/02` §14's table to carry permission keys alongside the prose, so the "human-readable summary" and the enforcement source of truth stay reconcilable.
3. **Adopt a standing rule** (proposed): every module's own Sprint must specify the role mappings for the keys it introduces, as a Definition-of-Ready item. This prevents the same gap recurring for all 23 remaining keys.
4. **Until decided:** leave fail-closed. Do not grant speculatively.

### Blocks Sprint 1?
**Partially.** Does not block building `auth`/`users`/`admin`. **Does** block full RBAC acceptance testing beyond `SUPER_ADMIN`, and therefore the `docs/15` §3.1 acceptance criterion's "permission-checked against a protected route" step for any realistic staff role.

### Required approval authority
**Principal Security Architect** (owns RBAC/permission model per `docs/09` §2.3–2.4 and `docs/17` §8), with Product Director consulted on the business meaning of each staff role.

---

## 5. Turbo / Next.js Typecheck–Build Task-Graph Race

### Problem
`pnpm turbo run lint typecheck test build` — the exact command `.github/workflows/pr-checks.yml` runs on every PR — fails intermittently on `admin:typecheck` / `storefront:typecheck`.

### Is it real and reproducible? — **Yes. Confirmed, deterministically.**

Investigated the actual files (`turbo.json`, `apps/{admin,storefront}/package.json`, `apps/{admin,storefront}/tsconfig.json`, `apps/{admin,storefront}/next.config.ts`, `.github/workflows/pr-checks.yml`).

Reproduction, run in this review:

| Precondition | Attempts | Result |
|---|---|---|
| `.next/` **absent** (clean) | 1 | 23/23 tasks pass |
| `.next/` **present** (stale, from a prior build) | 2 | **2/2 FAILED** |

Failure signature is unambiguous:
```
admin:typecheck: error TS6053: File '.../apps/admin/.next/types/app/layout.ts' not found.
admin:typecheck: error TS6053: File '.../apps/admin/.next/types/cache-life.d.ts' not found.
```

### Root cause
Three locked/existing facts combine:
1. `apps/{admin,storefront}/tsconfig.json` includes `".next/types/**/*.ts"` — the standard Next.js App Router route-type include.
2. `turbo.json`'s `typecheck` declares `dependsOn: ["^build"]` — **upstream** packages' builds only, **not** the same package's `build`.
3. Therefore, within one package, `typecheck` and `build` run **concurrently**. `next build` clears and regenerates `.next/types/**` at the start of its run, while `tsc --noEmit` is reading those same files.

With no `.next/` present, `tsc` never resolves the glob to any file and the race has no surface — which is exactly why a clean CI runner may pass while a warm cache fails. **This is latent in CI**: it will appear as soon as a runner or Turborepo cache restores a prior `.next/`, and will read as a flaky, unrelated type error.

### Smallest compliant fix (proposed — **not applied**)
A Turborepo **Package Configuration** in each Next.js app, adding same-package `build` to that package's `typecheck` only:

```jsonc
// apps/admin/turbo.json  (and apps/storefront/turbo.json)
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": { "typecheck": { "dependsOn": ["^build", "build"] } }
}
```

**Validated in this review:** with the candidate applied and a stale `.next/` deliberately present — the exact scenario that failed 2/2 — the suite passed **2/2, 23/23 tasks**. The candidate was then **reverted**; the working tree is unchanged.

### Does the fix violate `docs/05` or `docs/07`?
**No.** Checked against both:

- **`docs/05` §14.1** specifies `typecheck` depends on "`^build` **for packages whose types are consumed across a package boundary**". That wording is conditional and package-scoped, not a global prohibition. The root `turbo.json` keeps `^build` unchanged for all ten packages; this adds a narrower, additive constraint for the two packages whose typecheck genuinely consumes *their own* build output. The stated intent — "ensures `@nfi/shared` type changes are validated against every consumer before merge" — is preserved intact.
- **`docs/05` §14.1's `lint` row** — "Depends on: Nothing... fast-fails PRs without waiting on a full build" — is untouched. Lint still runs immediately.
- **`docs/07`** — introduces **no new technology**. Package Configurations are a native Turborepo 2.x feature; Turborepo `^2.3.0` is already locked (`docs/07` §20, `docs/05` §4–5).
- **`docs/06` §9** — adds no new top-level folder; a per-package `turbo.json` sits alongside the existing per-package `eslint.config.js`/`tsconfig.json`.

**Alternatives considered and rejected:** removing `.next/types` from `tsconfig.include` (silently drops Next.js route type-safety — a real regression once routes exist); making `typecheck` globally depend on same-package `build` (slower feedback for all ten packages, and a broader change than the defect warrants).

### Security impact
None directly. Indirect: a *chronically* flaky CI check trains reviewers to re-run rather than read failures — which erodes the merge gate that `docs/11` §4.5 and `docs/12` §9's flaky-test policy depend on. `docs/12` §9 explicitly treats flakiness as a defect to fix, not tolerate.

### Operational impact
Currently latent; will surface as intermittent red PRs with a misleading error.

### Development impact
Small and contained: one 6-line file per Next.js app. Slight increase in `typecheck` wall-clock for those two packages (they now wait on their own build), offset against eliminating a false-failure class.

### Recommended decision
**Apply the proposed fix**, as a standalone DevOps change with its own PR — separate from any Sprint 1 module work.

### Consequences
- **If applied:** race eliminated (validated); CI signal becomes trustworthy.
- **If not applied:** intermittent CI failures unrelated to the code under review, most likely first appearing when Sprint 1 raises PR volume.

### Blocks Sprint 1?
**No.** It degrades CI signal quality but blocks nothing. Should be fixed *before* Sprint 1 raises PR volume.

### Required approval authority
**Principal DevOps Architect** — `turbo.json` is `@nfi-org/devops`-owned per `CODEOWNERS`, and `docs/17` §8 assigns the Repository/DevOps domain there. Two approvals required if treated as a shared-config change (`docs/11` §4.2).

---

## Decision Summary

| Decision | Status | Sprint 1 Impact | Required Approval |
|----------|--------|-----------------|-------------------|
| schema_migrations | PROPOSED — recommend approve Option 1 | Does not block implementation; blocks release-checklist completeness (`docs/13` §10.2) | Principal Database Architect + Principal Software Architect |
| Privileged account provisioning | PROPOSED — recommend approve Option A; defer Option B with a trigger | **BLOCKS `RegisterUser`** and end-to-end demonstration of the `docs/15` §3.1 acceptance criterion; 6 of 7 `auth` use cases, all `users`, all `admin` unblocked | **Principal Security Architect** + Principal Software Architect |
| IaC tooling | PROPOSED — **no option recommended**; escalated for `docs/07`-grade analysis | Does not block implementation; **blocks Definition of Done** (`docs/11` §7.2) for every Story | CTO + Principal DevOps Architect (+ Engineering Director for the DoD-amendment question) |
| Role-permission matrix | OPEN — 1 of 7 roles specified; 6 unspecified, fail-closed | Does not block building; blocks RBAC acceptance testing beyond `SUPER_ADMIN` | Principal Security Architect (Product Director consulted) |
| CI task-graph race | CONFIRMED reproducible; fix validated and reverted, awaiting approval | Does not block; degrades CI signal — fix before PR volume rises | Principal DevOps Architect |

---

**FOUNDATION STATUS:**
**READY**

The cross-cutting foundation is complete and independently verified: all Sprint-1-blocking `core/` subsystems built (`security`, `exceptions`, `di`, plus `database`'s transaction helper), the `/health`÷`/ready` split corrected and proven under real dependency failure, the identity database foundation applied and verified live with idempotency demonstrated, 20/20 tests and 23/23 turbo tasks green from a clean state, module-boundary enforcement re-smoke-tested, and zero business logic written (`apps/api/src/modules/` contains 0 `.ts` files). The one CI defect found is real but non-blocking, with a validated fix awaiting DevOps approval.

**SPRINT 1 STATUS:**
**NOT READY**

One unresolved **security** decision (ADR-0002) blocks `RegisterUser` and the Phase 1 acceptance criterion; the role→permission matrix leaves 6 of 7 roles non-functional, blocking realistic RBAC acceptance testing; and no Story can satisfy `docs/11` §7.2's Definition of Done while Shared Development remains unprovisioned behind ADR-0003. Per the readiness gate's own wording, unresolved security ambiguity is disqualifying.

Every blocker is a governance decision, not an engineering task. **A single Architecture Review covering ADR-0001, ADR-0002, ADR-0003 and the role→permission matrix would clear all four**, since ADR-0002 and the matrix share the same approver and domain.

---

*This document is an architecture decision review. It changes no ADR status, adopts no option, modifies no locked document, provisions no infrastructure, adds no dependency, and implements no business logic. The one code change trialled (the Turborepo package configuration) was applied only to validate the proposed fix and was reverted; the working tree is unchanged.*
