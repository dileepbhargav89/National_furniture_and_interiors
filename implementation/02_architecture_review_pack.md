# Architecture Review Pack — Sprint 1 Entry

# ⚠ SPRINT 1 CANNOT START UNTIL SECURITY-CRITICAL DECISIONS ARE RESOLVED.

**Date:** 2026-08-11 · **Meeting length:** ~60 minutes · **Process:** `docs/11` §8.3, `docs/18` §6.3

**Seven decisions. Two are security-critical (§1, §2) and block Sprint 1 outright.**

**Suggested agenda — Session 1 (~35 min, Principal Security Architect must attend):** items 1 → 2 → 3 → 4.
**Session 2 (~25 min, CTO + Engineering Director):** items 5 → 6. Item 7 is an independent DevOps PR.

**Nothing in this pack is approved.** Every recommendation is engineering analysis awaiting authority.

---

## Item 1 — ADR-0002: Privileged-Account Provisioning 🔴 SECURITY-CRITICAL

| | |
|---|---|
| **DECISION** | May `POST /auth/register` create `STAFF`/`ADMIN` accounts? |
| **RECOMMENDATION** | **No — Option A.** Public register creates `CUSTOMER` only and does not accept `userType`/`roleId`. Privileged accounts via authenticated `POST /admin/users`. First `SUPER_ADMIN` via migration |
| **EVIDENCE** | `docs/09` §2.2 fail-closed · §1.12 admin = highest-value target · **§2.8 privileged identity changes are `SUPER_ADMIN`-mediated, "not a self-service reset, since self-service… is a well-known bypass vector"** · `docs/02` §14 · `docs/08` §8 (`/admin/users` already exists) · `docs/18` §8 "Do not bypass RBAC" |
| **RISK** | Anonymous → `STAFF` in one unauthenticated request. Attacker enrols **their own** MFA, so MFA authenticates the attacker. Nullifies MFA, permission-key RBAC, and admin network hardening simultaneously. `docs/09` §10 calls a compromised `SUPER_ADMIN` "the platform's ceiling risk" |
| **APPROVER** | **Principal Security Architect** + Principal Software Architect |
| **EXACT QUESTION** | *"Do we approve Option A — public registration is `CUSTOMER`-only, `userType`/`roleId` rejected by schema, privileged accounts created solely via authenticated `POST /admin/users`?"* |
| **APPROVAL STATEMENT** | "ADR-0002 is APPROVED — Option A. Option B (invitation flow) is Deferred with trigger ______. `docs/08` §8's `auth` row to be updated with a Revision History entry citing ADR-0002. `RegisterUser` implementation is authorized." |
| **CONSEQUENCE** | Unblocks `RegisterUser` and makes acceptance test 1b (anonymous `userType: STAFF` → `400`) writable — the regression guard for this decision. **Note: does not alone make the acceptance criterion demonstrable — see Item 2** |

*Detail: `implementation/02_adr_0002_review_sheet.md`*

---

## Item 2 — Role → Permission Matrix 🔴 SECURITY-CRITICAL

| | |
|---|---|
| **DECISION** | 36 of 42 role→permission cells are unspecified by any locked document |
| **RECOMMENDATION** | **No blanket recommendation** — 4 structural questions need answers; 3 need confirmation only |
| **EVIDENCE** | `docs/02` §14's table is organised by **business module**; Phase-1 keys are `auth`/`users`/`admin` — an axis it never addresses. **Structural gap in the baseline, not a defect in migration `0002`** |
| **RISK** | Currently fail-closed = safe but non-functional (6 of 7 roles hold zero permissions). **Principal risk: silent grant-widening under deadline pressure** when the RBAC acceptance test fails |
| **APPROVER** | **Principal Security Architect** (Product Director consulted on Q8) |
| **EXACT QUESTIONS** | **Q1 (highest leverage):** Is `users.read_self` an explicit grant, or inherent to every authenticated principal? *Resolves 7 cells; if "explicit" and ungranted, **no customer can read their own profile**.*<br>**Q2/Q3:** Do any staff roles get `users.read` / `users.write`? *(recommend `SUPER_ADMIN` only)*<br>**Q4:** Any role besides `SUPER_ADMIN` for `admin.view_audit_log`? *(recommend no)*<br>**Q5–Q7 (confirm only):** `auth.manage_mfa` = `SUPER_ADMIN` only (`docs/09` §2.8) · `admin.manage_roles` = `SUPER_ADMIN` only (`docs/08` §8) · **`SUPPORT_AGENT`'s "Customers (read)" maps to `crm.read`, NOT `users.read`** — `customers` is a `crm` collection (`docs/03` §9.7.1); the wrong mapping would expose every staff/admin identity record<br>**Q9:** Disambiguate "admin" in `docs/08` §8's "(admin, any user)" — module, `userType`, or role?<br>**Q10:** Adopt a standing DoR rule that every module Sprint specifies mappings for keys it introduces? *(prevents this recurring for the other 23 keys)* |
| **APPROVAL STATEMENT** | "The Phase-1 role→permission matrix is APPROVED as recorded in the decision sheet's §6, answers Q1–Q10. A migration `0003` applying the agreed grants is authorized." |
| **CONSEQUENCE** | Unblocks RBAC acceptance testing beyond `SUPER_ADMIN`, and with Item 1 makes `docs/15` §3.1's acceptance criterion fully demonstrable |

*Detail: `implementation/02_phase1_role_permission_decision_sheet.md`*

---

## Item 3 — ADR-0001: `schema_migrations`

| | |
|---|---|
| **DECISION** | Add `schema_migrations` to `docs/03` §4 as a 36th collection? |
| **RECOMMENDATION** | **Yes — Option 1.** Deployment metadata only; no PII, no business data, append-only |
| **EVIDENCE** | `docs/13` §5.6, §14 · `docs/16` §8.3 item 3, §17 ("should become formal ADRs early in implementation… none changes an approved architectural decision") · `docs/18` §2.6 (binding) |
| **RISK** | Very low. Not approving leaves `docs/13` §10.2's release-checklist item permanently unsatisfiable |
| **APPROVER** | Principal Database Architect + Principal Software Architect |
| **EXACT QUESTION** | *"Do we approve adding `schema_migrations` to the Collection Inventory?"* |
| **APPROVAL STATEMENT** | "ADR-0001 is APPROVED. `schema_migrations` added to `docs/03` §4 per the review sheet. Migration-tracking implementation authorized." |
| **CONSEQUENCE** | Runner records applied migrations at the extension point already marked in `run.ts` (~15 lines) |

*Detail: `implementation/02_adr_0001_review_sheet.md`*

---

## Item 4 — Rate-Limit Dependencies

| | |
|---|---|
| **DECISION** | Do `express-rate-limit` / `rate-limit-redis` require an ADR, or are they implementation detail? |
| **RECOMMENDATION** | **Implementation detail — retain, no ADR** |
| **EVIDENCE** | Capability locked in four places (`docs/02` §16; `docs/07` §4.2, §7.1; `docs/08` §4.4). **Decisive precedent: `ioredis` and `jsonwebtoken` have ZERO mentions in `docs/07` yet shipped in the original Sprint 0 scaffold** — the baseline's own practice is that locked docs name the capability, not the npm package |
| **RISK** | Low. Requiring an ADR here would, for consistency, retroactively require one for `ioredis`, `jsonwebtoken`, and `cors` |
| **APPROVER** | Principal Software Architect (Security consulted on fail-closed behavior) |
| **EXACT QUESTION** | *"Are these implementation detail of the already-locked Redis-backed rate-limiting capability?"* |
| **APPROVAL STATEMENT** | "Dispositioned as implementation detail. No ADR required. Fail-closed behavior on Redis-store failure to be verified during Sprint 1." |
| **CONSEQUENCE** | If **rejected**: both packages removed, `core/security/rate-limit.ts` withdrawn, ADR drafted for CTO |

*Detail: `implementation/02_rate_limit_dependency_decision.md`*

---

## Item 5 — ADR-0003: IaC Tooling *(Session 2 — CTO)*

| | |
|---|---|
| **DECISION** | Which IaC technology? `docs/07` has **no IaC category** across all 21 categories |
| **RECOMMENDATION** | **None — deliberately.** AI selected no tool. Analysis narrows only |
| **EVIDENCE** | CDK **169** / CloudFormation **151** score poorly because `docs/10` §9.4 (**MongoDB Atlas**) and `docs/07` §19.1 (**Vercel**) are locked and neither covers them → three of five providers outside version control, against `docs/10` §2.2. Terraform **222** vs OpenTofu **223** — **not technically decisive** |
| **RISK** | Two genuine judgements, **neither technical**: (i) **licensing** BUSL-1.1 vs MPL-2.0 — a legal question; (ii) **multi-provider coverage vs. no-state-file-to-secure** — a real security trade-off under `docs/09` §5.1 |
| **APPROVER** | **CTO** (authority) + Principal DevOps Architect (consultation) |
| **EXACT QUESTION** | *"Which IaC tool, and is this a Sprint 1 blocker or a parallel DevOps track?"* |
| **APPROVAL STATEMENT** | "ADR-0003 is APPROVED. IaC technology is ______. To be added to `docs/07` as a new category in that document's format with a Revision History entry. Sprint 1 impact: **is / is not** a blocker." |
| **CONSEQUENCE** | Unblocks IaC authoring. **Does not alone produce Shared Development** — cloud accounts and credentials remain external |

*Detail: `implementation/02_adr_0003_human_decision_sheet.md`*

---

## Item 6 — Shared Development / DoD *(Session 2 — Engineering Director)*

| | |
|---|---|
| **DECISION** | Provision Shared Dev (A), or approve a time-boxed DoD exception (B)? |
| **RECOMMENDATION** | **Approve B now, pursue A in parallel; B expires automatically when A completes.** A sequencing recommendation only |
| **EVIDENCE** | `docs/11` §7.2 requires "Deployed to Shared Development" for every Story · `docs/13` §2.2 "Code cannot skip a stage" · Shared Dev **NOT PROVISIONED**, blocked on Item 5 **and** external cloud accounts |
| **RISK** | **Option C (mark Stories Done anyway) is PROHIBITED (`docs/18` §7 Rule 4) — and is the default outcome if this goes undecided.** Under B: env-specific defects could pass Local; mitigated by re-verification before M1 |
| **APPROVER** | **Engineering Director** (owns `docs/11`); Principal DevOps Architect + Principal QA Architect consulted |
| **EXACT QUESTION** | *"Do we approve a time-boxed DoD exception substituting the verified Local stack until Shared Development exists?"* |
| **APPROVAL STATEMENT** | "A time-boxed DoD exception is APPROVED for Sprint 1. `docs/11` §7.2's Shared Dev requirement is satisfied by demonstration against the verified Local environment, recorded per Story. Expires ______ or on provisioning. Stories closed under it are re-verified before M1 sign-off. `docs/11` §7.2 amended with a Revision History entry." |
| **CONSEQUENCE** | Sprint 1 Stories become closable under an honest, recorded rule. **Without this decision, no Story can be Done** |

*Detail: `implementation/02_shared_dev_human_decision_sheet.md`*

---

## Item 7 — Turbo Race Fix *(independent DevOps PR)*

| | |
|---|---|
| **DECISION** | Merge the per-package `turbo.json` fix? |
| **RECOMMENDATION** | **Yes** — standalone PR, before Sprint 1 raises PR volume |
| **EVIDENCE** | Reproduced **4/4** with stale `.next/`, **0/2** clean. Fix validated **2/2** under the failing precondition. Root cause: `tsconfig` includes `.next/types/**` while `turbo.json` gives `typecheck` only `^build`, so typecheck races build within a package |
| **RISK** | Low. Compatible with `docs/05` §14.1 (conditional, package-scoped wording; root config unchanged; `lint` untouched) and `docs/07` (native Turborepo 2.x feature, no new dependency) |
| **APPROVER** | **Principal DevOps Architect** (`turbo.json` is `@nfi-org/devops`-owned) |
| **EXACT QUESTION** | *"Approve merging `apps/admin/turbo.json` and `apps/storefront/turbo.json`?"* |
| **APPROVAL STATEMENT** | "The Turborepo package-configuration fix is APPROVED for merge. No ADR required." |
| **CONSEQUENCE** | CI becomes deterministic — a typecheck failure means a real type error |

*Detail: `implementation/02_turbo_race_merge_plan.md`*

---

## Decision Dependency Map

```
Item 1 (ADR-0002) ──┐
                    ├──> Sprint 1 acceptance criterion demonstrable
Item 2 (RBAC) ──────┘

Item 5 (IaC) ──> Shared Dev provisioning ──┐
                                           ├──> DoD satisfiable
Item 6 (DoD exception) ────────────────────┘   (either path suffices)

Item 3 (ADR-0001) ──> docs/13 §10.2 satisfiable   [independent]
Item 4 (rate-limit) ──> governance hygiene        [independent]
Item 7 (turbo) ──> CI trustworthy                 [independent]
```

**Items 1 and 2 share one approver and one domain — decide together.** Items 3, 4 fit the same session cheaply. Items 5, 6 need different authority. Item 7 is a PR, not a meeting item.

---

## Post-Meeting Actions

1. Record every outcome as Approved / Rejected / **Deferred with a named trigger** (`docs/18` §6.3) — never leave one silent.
2. Update each ADR's status and Approval section.
3. Update locked documents per `docs/18` §5.1 (Revision History citing the ADR) for each approval: `docs/03` §4 (Item 3), `docs/08` §8 (Item 1), `docs/02` §14 (Item 2), `docs/07` (Item 5), `docs/11` §7.2 (Item 6).
4. Re-run `implementation/02_sprint1_entry_gate.md` and update the verdict.
5. **Only then** authorize Sprint 1 — Identity & Access implementation.

---

*Nothing in this pack is approved. Every ADR retains its pre-meeting status. No locked document has been modified.*
