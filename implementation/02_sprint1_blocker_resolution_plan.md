# Sprint 1 — Blocker Resolution Plan

**Date:** 2026-08-11
**Status:** Governance resolution phase. No business module implemented, no infrastructure provisioned, no ADR self-approved.
**Governing rules:** `docs/18_CLAUDE_CONSTITUTION.md` §2, §6, §7, §8.

**Status vocabulary used throughout this document set:**

| Status | Meaning |
|---|---|
| **VERIFIED** | Confirmed by direct observation of the live repository this session |
| **RECOMMENDED** | Evidence supports a specific outcome; no authority has adopted it |
| **OPEN** | Evidence is insufficient or ambiguous; no recommendation possible |
| **HUMAN APPROVAL REQUIRED** | A named human role must decide; AI cannot |
| **BLOCKED** | Dependent work cannot proceed |
| **APPROVED** | Reserved. Applied **only** when an authorized human has actually approved. **Currently used zero times.** |

---

## 1. Current Repository State — VERIFIED

Re-verified this session with the exact commands specified; the prior report was not trusted.

| Item | State | Method |
|---|---|---|
| Working tree | 2 modified ADRs + 5 untracked analysis docs (prior session, uncommitted) | `git status --short` |
| Commits | 5, HEAD `08b16e6` | `git log --oneline -10` |
| **`docs/01`–`18`** | **Unmodified** — `git diff` across all 18 returns empty | `git diff -- docs/01…docs/18` |
| Business logic | **0 `.ts` files** in `apps/api/src/modules/` | `find` |
| `core/` | 22 `.ts` files, 10 subsystems | `find` |
| Migrations | `0001`, `0002`, `run.ts`, `types.ts` | `ls` |
| ADRs | 3 — statuses in §2 | `ls docs/adr` |
| `turbo.json` overrides | **0** — candidate fix not merged | `ls apps/*/turbo.json` |
| Dependencies | No drift this session | `git diff -- '*/package.json'` |
| Remote | `origin` configured, **nothing pushed** | `git remote -v` |
| **Approval mechanism** | **Does not exist** — CODEOWNERS carries self-documented placeholder `@nfi-org/*` handles; no GitHub organisation | `head CODEOWNERS` |

**The last row governs everything below.** `docs/18` §6.3 vests ADR approval in a scheduled Architecture Review by named human roles. No such mechanism is reachable from this repository, so no ADR can legitimately move to APPROVED in this session regardless of evidence strength.

---

## 2. All Blockers

| ID | Blocker | Status | Blocks |
|---|---|---|---|
| **B1** | ADR-0002 — privileged-account provisioning | RECOMMENDED (Option A) — **HUMAN APPROVAL REQUIRED** | `RegisterUser`; end-to-end acceptance criterion |
| **B2** | Role→permission matrix — 36 of 42 cells | **OPEN — HUMAN DECISION REQUIRED** | RBAC acceptance testing beyond `SUPER_ADMIN` |
| **B3** | ADR-0003 (IaC) + Shared Development | **OPEN** (IaC) + **BLOCKED** (external credentials) | `docs/11` §7.2 Definition of Done, all Stories |
| **B4** | ADR-0001 — `schema_migrations` | RECOMMENDED — **HUMAN APPROVAL REQUIRED** | `docs/13` §10.2 release-checklist item |
| **B5** | Turbo race fix | RECOMMENDED — **HUMAN APPROVAL REQUIRED** (DevOps) | Nothing; degrades CI trustworthiness |
| **B6** | Rate-limit package governance | RECOMMENDED (retain) — confirmation required | Nothing; governance hygiene |

---

## 3. Exact Source-Document Evidence

| ID | Primary evidence |
|---|---|
| B1 | `docs/09` §2.2 (fail-closed), §1.12 (admin = highest-value target), §2.8 (privileged identity changes are `SUPER_ADMIN`-mediated, *not* self-service); `docs/02` §14; `docs/08` §8 (`auth` + `users` rows); `docs/18` §8 ("Do not bypass RBAC") |
| B2 | `docs/02` §14 (role table, explicitly "a human-readable summary… not the enforcement mechanism"); `docs/03` §9.1.2–9.1.3 (enforcement source of truth); `docs/08` §8; `docs/09` §2.2, §2.4, §11 rule 6 |
| B3 | `docs/10` §3.2 (Shared Dev = real cloud infra), §2.2 ("configuration is data"), §9.2/§9.4; `docs/11` §7.2 (DoD); `docs/13` §2.2 (no stage skipped); `docs/07` (no IaC category, verified across all 21 categories); `docs/18` §2.4 |
| B4 | `docs/13` §5.6, §10.2, §14; `docs/16` §8.3 item 3, §17; `docs/18` §2.6 ("MUST be formally closed via ADR before or during its first use"), §6.4 |
| B5 | `docs/05` §14.1 (task pipeline); `docs/07` §20 (Turborepo locked); `docs/12` §9 (flaky tests are defects) |
| B6 | `docs/02` §16 ("Rate limiting \| Redis-backed, per-IP and per-account"); `docs/07` §4.2 (Express responsibilities include rate-limit middleware), §7.1 (Redis as "rate-limit counter store"); `docs/08` §4.4 (concrete tiers) |

---

## 4. Decision Required, per Blocker

| ID | Exact decision needed |
|---|---|
| B1 | May `POST /auth/register` create `STAFF`/`ADMIN`? (Recommended answer: **no — `CUSTOMER` only**) |
| B2 | 36 role→permission cells, plus 7 structural questions (A–G in the decision sheet) |
| B3 | (i) Which IaC tool? (ii) Provision Shared Dev, or approve a time-boxed DoD exception? |
| B4 | Adopt Option 1 — add `schema_migrations` to `docs/03` §4? |
| B5 | Merge the per-package `turbo.json` fix? |
| B6 | Do `express-rate-limit`/`rate-limit-redis` require an ADR, or are they implementation detail? |

---

## 5. Authorized Decision Maker

Per `docs/17` §8's Decision Ownership Matrix:

| ID | Authority | Consulted |
|---|---|---|
| B1 | **Principal Security Architect** + Principal Software Architect | — |
| B2 | **Principal Security Architect** | Product Director |
| B3 (IaC) | **CTO** + Principal DevOps Architect | — |
| B3 (DoD) | **Engineering Director** (owns `docs/11`) | Principal DevOps Architect |
| B4 | Principal Database Architect + Principal Software Architect | — |
| B5 | **Principal DevOps Architect** | — |
| B6 | Principal Software Architect | Principal Security Architect |

---

## 6. What Can Be Resolved by Engineering — COMPLETE

Everything in this category is already done. Nothing further is achievable inside this repository.

| Item | Status |
|---|---|
| `core/` foundation (10 subsystems) | ✅ VERIFIED |
| `/health` ÷ `/ready` split, proven under real dependency failure | ✅ VERIFIED |
| Database foundation — indexes + reference data, idempotency proven | ✅ VERIFIED |
| Evidence gathering for all six blockers | ✅ VERIFIED |
| Turbo race root-cause + 4-scenario reproduction + validated fix | ✅ VERIFIED |
| IaC comparative analysis to `docs/18` §6.2 standard | ✅ VERIFIED |
| Permission-key extraction (29 keys, none invented) | ✅ VERIFIED |
| Test suite green (20/20), lint/typecheck/build green (23/23 clean) | ✅ VERIFIED |

---

## 7. What Requires Human Approval

**All six blockers.** None is an engineering task. See §5 for authorities and `implementation/02_architecture_review_pack.md` for the consolidated approval pack.

---

## 8. What Must Remain Blocked

| Item | Until |
|---|---|
| `RegisterUser` implementation | ADR-0002 approved |
| `schema_migrations` tracking code | ADR-0001 approved (`docs/18` §6.4) |
| RBAC acceptance tests beyond `SUPER_ADMIN` | B2 resolved |
| Any Story marked "Done" | B3's DoD question resolved |
| IaC authoring / cloud provisioning | ADR-0003 approved **and** credentials supplied |
| Merging the turbo fix | B5 approved |

---

## 9. Dependencies Between Decisions

```
B1 (ADR-0002) ──────────────┐
                            ├──> Sprint 1 acceptance criterion demonstrable
B2 (RBAC matrix) ───────────┘

B3-IaC (ADR-0003) ──> Shared Dev provisioning ──> DoD satisfiable
       └─(alternative)──> B3-DoD exception ─────> DoD satisfiable

B4 (ADR-0001) ──> schema_migrations tracking ──> docs/13 §10.2 satisfiable
B5 (turbo) ──> CI trustworthy            [independent]
B6 (rate-limit) ──> governance hygiene   [independent]
```

**Critical path:** B1 and B2 share one approver and one domain — they should be decided together. B3's two halves are independent of everything else and of each other (a DoD exception does not require the IaC decision).

---

## 10. Exact Sprint 1 Entry Criteria

See `implementation/02_sprint1_entry_gate.md` for the authoritative 20-item checklist. Summary: 5 technical criteria are met; 6 governance criteria are not.

---

## 11. Definition of Ready for Sprint 1

Derived from `docs/11` §7.1, applied at Sprint rather than Story level:

- [ ] B1 decided and recorded
- [ ] B2 decided to at least the subset needed for acceptance testing
- [ ] B4 decided (or explicitly deferred with a named trigger)
- [ ] B6 dispositioned
- [ ] B3's DoD treatment decided — provision, or approved exception
- [ ] B5 merged or explicitly accepted as a known CI defect
- [ ] Every Story cites its locked-document contract (`docs/11` §7.1)
- [ ] Security Review flagged in advance — **automatic for every Sprint 1 Story**, since all touch Tier 1/2 data (`docs/09` §1.4, `docs/11` §7.1)

---

## 12. Definition of Done for Sprint 1

`docs/11` §7.2 verbatim, with current satisfiability assessed:

| DoD item | Satisfiable today? |
|---|---|
| Code merged to `main` | ✅ |
| Automated quality gates passing | ⚠️ Yes, but CI non-deterministic until B5 |
| Correct approval count (2 for `core/`/shared — `docs/11` §4.2) | ⚠️ No real reviewers exist |
| Tests at appropriate tiers, coverage floor met (`docs/12` §6.2) | ✅ |
| Documentation updated (`docs/11` §6.1) | ✅ |
| Acceptance criteria verified against a running environment | ✅ Local stack verified |
| **Deployed to Shared Development and confirmed functioning** | ❌ **NO — B3** |

**No Sprint 1 Story can currently satisfy the DoD.** Marking Stories Done regardless is prohibited (`docs/18` §7 Rule 4) and is the realistic default failure mode if B3's DoD question goes undecided.

---

## 13. Final Approval Checklist

To be completed by the Architecture Review, not by engineering:

- [ ] **B1** ADR-0002 — outcome recorded (Approved / Rejected / Deferred) — *Principal Security Architect + Principal Software Architect*
- [ ] **B2** RBAC matrix — 36 cells + questions A–G — *Principal Security Architect*
- [ ] **B4** ADR-0001 — outcome recorded — *Principal Database Architect + Principal Software Architect*
- [ ] **B6** Rate-limit packages — dispositioned — *Principal Software Architect*
- [ ] **B5** Turbo fix — merge approved — *Principal DevOps Architect*
- [ ] **B3a** ADR-0003 IaC tool — selected and authored to `docs/07` format — *CTO + Principal DevOps Architect*
- [ ] **B3b** Shared Dev path — Option A or B chosen and recorded — *Engineering Director*
- [ ] Locked documents updated per `docs/18` §5.1 for every Approved ADR
- [ ] `implementation/02_sprint1_entry_gate.md` re-run and verdict updated

---

*This plan approves nothing, implements nothing, and modifies no locked document.*
