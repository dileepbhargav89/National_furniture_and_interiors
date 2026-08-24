# Phase 1 Role → Permission — Human Decision Sheet

**For:** Architecture Review — **Principal Security Architect** (Product Director consulted)
**Status:** **OPEN — HUMAN DECISION REQUIRED.** 36 of 42 cells unresolved.
**Predecessor analysis:** `implementation/01_phase1_role_permission_matrix.md`

> **No grant in this document is applied.** Migration `0002-identity-reference-data` is unchanged and must **not** be edited to make tests pass.

---

## 1. Enforcement Model — Confirmed (Question G)

**G. Is `roles.permissionIds[] → permissions.key` the enforcement source of truth?**

**Answer: YES — VERIFIED, no decision needed.**

`docs/03` §9.1.2–9.1.3 define it. `docs/02` §14 explicitly labels its own role table "a human-readable summary of which permission keys each role is granted, kept here for admin-UI design reference" and states enforcement is by permission key, **not** by that table. `docs/02` §18's ADR summary records permission-key granularity as the chosen model, resolving review finding S2. `docs/09` §2.4 adds the `<module>.<action>` taxonomy rule.

**Consequence:** every decision below is a decision about which `permissionIds[]` entries a role document carries. Nothing else enforces access.

---

## 2. The Six Phase-1 Keys — VERIFIED, none invented

| Key | Verbatim source |
|---|---|
| `auth.manage_mfa` | `docs/08` §8 `auth` row — "`auth.manage_mfa` for admin-forced MFA reset" |
| `users.read_self` | `docs/08` §8 `users` row — "`users.read_self` (implicit for own profile)" |
| `users.read` | `docs/08` §8 `users` row — "`users.read`/`users.write` (admin, any user)" |
| `users.write` | `docs/08` §8 `users` row — same |
| `admin.manage_roles` | `docs/08` §8 `admin` row |
| `admin.view_audit_log` | `docs/08` §8 `admin` row |

29 permission keys exist platform-wide; the other 23 belong to unbuilt modules and are correctly unseeded (`docs/09` §11 rule 6).

---

## 3. Structural Questions A–F

### A. Is `users.read_self` explicitly granted, or inherent to every authenticated principal?

**OPEN — HUMAN DECISION REQUIRED.** The single highest-leverage question in this sheet.

`docs/08` §8 says "`users.read_self` (implicit for own profile)". Two defensible readings, and the documents do not disambiguate:

| Reading | Implication | Consequence if wrong |
|---|---|---|
| **A1 — Explicit grant.** The key must appear in `roles.permissionIds[]` like any other | All 7 roles need it seeded | If not seeded: **every user, including every customer, gets `403` on `GET /users/me`** |
| **A2 — Inherent.** "implicit" means every authenticated principal holds it; it never appears in a grant list | `rbacMiddleware` special-cases it; it is never seeded | Creates one permission that bypasses the enforcement model in §1 — a precedent that could erode `docs/02` §18's S2 resolution |

**Security consequence:** A1 is more consistent with §1's single-source-of-truth model and with `docs/09` §2.2's fail-closed posture. A2 is simpler operationally but introduces a second, implicit authorization path.
**Business consequence:** unresolved, **no customer can read their own profile** — the storefront account page cannot function.
**Recommendation:** **OPEN.** Reviewer to choose. If A1 is chosen, all 7 roles receive `users.read_self`; that single answer resolves 7 of the 36 cells.
**Approver:** Principal Security Architect.

### B. Which role, if any, receives `users.read` / `users.write`?

**OPEN — HUMAN DECISION REQUIRED.**

`docs/08` §8 qualifies both as "(admin, any user)". **The word "admin" is itself ambiguous** between:
- the `admin` **module** (`docs/06` §4.3), and
- the `ADMIN` **`userType`** (`docs/03` §9.1.1), and
- the `SUPER_ADMIN` **role** (`docs/03` §9.1.2).

`docs/02` §14 grants `SuperAdmin` "Full access, including User & Role Management" — explicit for `SUPER_ADMIN`. **No other role is described in terms of user-record access anywhere.**

**Security consequence:** `users.read` exposes the full `users` collection — every staff and admin identity record (`docs/03` §9.1.1: email, phone, `userType`, role, lockout state). Granting it broadly materially widens the blast radius of any single compromised staff account (`docs/09` §10's `crm` row already flags an over-privileged `SALES_MANAGER` as "a high-value single point of compromise").
**Recommendation:** **`SUPER_ADMIN` only** is the sole evidenced position; anything broader is **OPEN**. The reviewer should also settle the "admin" ambiguity explicitly so it does not recur for all 23 remaining keys.
**Approver:** Principal Security Architect.

### C. Is `auth.manage_mfa` `SUPER_ADMIN`-only?

**RECOMMENDED — YES.** Evidence is direct: `docs/09` §2.8 states a lost-TOTP-device staff member "must go through **identity re-verification by a `SUPER_ADMIN`**", explicitly not self-service. `docs/08` §8 scopes the key to "admin-forced MFA reset".

**Security consequence:** `auth.manage_mfa` can reset another user's second factor — an account-takeover primitive if held broadly. `docs/09` §2.8 calls self-service MFA reset "a well-known bypass vector"; granting this key widely reconstructs that vector through a different door.
**Recommendation:** **`SUPER_ADMIN` only.** Already seeded correctly. Requires confirmation, not a new decision.
**Approver:** Principal Security Architect (confirm).

### D. Are `admin.manage_roles` and `admin.view_audit_log` `SUPER_ADMIN`-only?

**`admin.manage_roles` — RECOMMENDED YES (explicit).** `docs/08` §8's `admin` row: "Role/permission management (**`SuperAdmin`-only** per `02` §14's role table)". `docs/09` §10's `admin` row: "Any `admin.manage_roles` action is high-priority-alerted regardless of apparent legitimacy."

**`admin.view_audit_log` — RECOMMENDED YES, weaker evidence.** Covered by `docs/02` §14's "Full access" for `SuperAdmin`, but no document explicitly *excludes* other roles. A reviewer might reasonably grant read-only audit access to a compliance-oriented role — none of which currently exists.

**Security consequence:** `admin.manage_roles` is the platform's privilege-escalation primitive — a holder can grant themselves any permission. It must remain maximally restricted. `admin.view_audit_log` is read-only but exposes cross-module activity including redacted PII change records (`docs/03` §9.8.2).
**Recommendation:** both **`SUPER_ADMIN` only**. Already seeded correctly.
**Approver:** Principal Security Architect (confirm).

### E. What is the exact authorization model for `CUSTOMER`?

**OPEN — HUMAN DECISION REQUIRED.**

**`CUSTOMER` does not appear in `docs/02` §14's role table at all** — that table lists six roles (SuperAdmin, Sales/Lead Manager, Design Manager, Designer, Catalog Manager, Support Agent). `CUSTOMER` exists only in `docs/03` §9.1.2's `name` enum. Its permission set is entirely unspecified.

Dependent on question A: if A1, `CUSTOMER` needs `users.read_self` explicitly; if A2, it needs nothing at Phase 1. `CUSTOMER`'s substantive keys (`cart.read_self`, `cart.write_self`, `orders.read_self`, `reviews.write_self`) all belong to unbuilt modules.

**Security consequence:** `CUSTOMER` is the largest population and the most likely credential-stuffing target (`docs/09` §1.13). Its grant set must stay minimal — **currently zero, which is correct**, pending A.
**Recommendation:** resolve A first; E follows mechanically.
**Approver:** Principal Security Architect + **Product Director** (customer-facing scope).

### F. Confirm `SUPPORT_AGENT` does **not** receive `users.read` from "Customers (read)"

**CONFIRMED — the inference is wrong on the documents' own terms. VERIFIED, no decision needed.**

`docs/02` §14 grants `SUPPORT_AGENT` "Customers (read)". That maps to **`crm.read`**, not `users.read`:

1. `customers` is a distinct collection in the **`crm`** module (`docs/03` §9.7.1).
2. `docs/03` §9.7.1 states `customers` "References `auth`'s `users` by ID only, **never duplicates identity data**."
3. `docs/08` §8's `crm` row already supplies the matching keys — **`crm.read` / `crm.write`** on `/admin/customers`.
4. `crm.read` is a **Phase-3** key (`docs/15` §3.1) — not in Phase 1 scope at all.

**Security consequence of the wrong inference:** granting `users.read` would give every support agent read access to **every staff and admin identity record**, not just customers — a substantial and entirely unintended privilege escalation.
**Recommendation:** keep `crm.read` and `users.read` strictly separate. `SUPPORT_AGENT` receives **no** Phase-1 key on this basis.
**Approver:** none needed — confirmation only.

---

## 4. Cell-by-Cell Decision Table

### 4.1 Resolved — 6 cells (`SUPER_ADMIN`)

| Role | Permission | Evidence | Explicit? | Recommendation | Approver |
|---|---|---|---|---|---|
| SUPER_ADMIN | `admin.manage_roles` | `docs/08` §8 — "`SuperAdmin`-only" | **YES** | GRANT *(seeded)* | Confirm |
| SUPER_ADMIN | `admin.view_audit_log` | `docs/02` §14 — "Full access" | **YES** | GRANT *(seeded)* | Confirm |
| SUPER_ADMIN | `auth.manage_mfa` | `docs/09` §2.8 | **YES** | GRANT *(seeded)* | Confirm |
| SUPER_ADMIN | `users.read` | `docs/02` §14 — "Full access… User & Role Management" | **YES** | GRANT *(seeded)* | Confirm |
| SUPER_ADMIN | `users.write` | `docs/02` §14 — same | **YES** | GRANT *(seeded)* | Confirm |
| SUPER_ADMIN | `users.read_self` | `docs/02` §14 — "Full access" | **YES** | GRANT *(seeded)* | Confirm |

### 4.2 Unresolved — 36 cells

`docs/02` §14 describes the five staff roles **only** in terms of business modules (Leads, Design Projects, Catalog, Orders, Media, Marketing) — **none of which is a Phase-1 module**. It therefore names no Phase-1 key for any of them. `CUSTOMER` is absent from the table entirely. This is a structural gap in the locked baseline, not an omission in migration `0002`.

**Rows 1–5 — the five staff roles, `admin.*` and `auth.manage_mfa` (15 cells):**

| Role | Permission | Current evidence | Explicit? | Possible interpretation | Security consequence | Business consequence | Recommendation | Approver |
|---|---|---|---|---|---|---|---|---|
| SALES_MANAGER / DESIGN_MANAGER / DESIGNER / CATALOG_MANAGER / SUPPORT_AGENT | `admin.manage_roles` | `docs/08` §8 — "`SuperAdmin`-only" | Explicitly **excluded** | None — exclusion is stated | Granting = privilege-escalation primitive in 5 more hands | None | **DENY** (fail-closed, already correct) | Confirm |
| *(same 5 roles)* | `admin.view_audit_log` | Silent | **NO** | A compliance role might warrant read-only audit access — no such role exists | Exposes cross-module activity + redacted PII change history | Staff cannot self-serve audit queries | **OPEN** — recommend DENY at Phase 1 | Principal Security Architect |
| *(same 5 roles)* | `auth.manage_mfa` | `docs/09` §2.8 — `SUPER_ADMIN` performs re-verification | Explicitly **excluded** | None | Account-takeover primitive | Staff MFA resets must route through `SUPER_ADMIN` | **DENY** (already correct) | Confirm |

**Rows 6–10 — the five staff roles, `users.*` (15 cells):**

| Role | Permission | Current evidence | Explicit? | Possible interpretation | Security consequence | Business consequence | Recommendation | Approver |
|---|---|---|---|---|---|---|---|---|
| *(5 staff roles)* | `users.read` | Silent. `docs/02` §14 describes each only via business modules. **`SUPPORT_AGENT`'s "Customers (read)" → `crm.read`, NOT this** (§3-F) | **NO** | Some staff roles may need to look up a user for support/assignment — or may be served entirely by `crm.read` | Exposes every staff/admin identity record; widens blast radius of a compromised staff account | Staff may be unable to resolve a user by email during support | **OPEN** — recommend DENY at Phase 1; revisit when `crm` is built | Principal Security Architect |
| *(5 staff roles)* | `users.write` | Silent | **NO** | Only `SUPER_ADMIN` is evidenced for user mutation | Write access to identity records = privilege-escalation adjacent (could alter `roleId`) | Staff cannot correct user records | **OPEN** — recommend DENY at Phase 1 | Principal Security Architect |
| *(5 staff roles)* | `users.read_self` | Dependent on **question A** | **NO** | A1 → grant all; A2 → grant none | Minimal — own record only | Staff cannot view own profile if A1 and ungranted | **OPEN** — resolve A | Principal Security Architect |

**Row 11 — `CUSTOMER`, all 6 cells:**

| Role | Permission | Current evidence | Explicit? | Possible interpretation | Security consequence | Business consequence | Recommendation | Approver |
|---|---|---|---|---|---|---|---|---|
| CUSTOMER | `admin.manage_roles`, `admin.view_audit_log`, `auth.manage_mfa`, `users.read`, `users.write` | **Not in `docs/02` §14's table at all**; `docs/08` §8's `admin` row restricts that module to `STAFF`/`ADMIN` `userType` | Explicitly **excluded** by userType gate | None | Catastrophic if granted | None — customers need none of these | **DENY** (already correct) | Confirm |
| CUSTOMER | `users.read_self` | Question A | **NO** | A1 → grant; A2 → inherent | Minimal — own record only | **If A1 and ungranted: no customer can read their own profile** — storefront account page non-functional | **OPEN** — resolve A | Principal Security Architect + Product Director |

---

## 5. Security Analysis Summary

| Dimension | Assessment |
|---|---|
| Over-permission risk | **None.** All 36 unspecified cells are ungranted — exactly `docs/09` §2.2's fail-closed requirement |
| Under-permission risk | **High and functional.** 6 of 7 roles hold zero Phase-1 permissions |
| Taxonomy compliance | ✅ `<module>.<action>`, no bare module grants (`docs/09` §2.4) |
| Enforcement integrity | ✅ Single source of truth preserved (§1) |
| **Principal residual risk** | **Silent grant-widening under deadline pressure.** With only `SUPER_ADMIN` functional, an implementer running the RBAC acceptance test will be tempted to add grants. `docs/09` §11 rule 6 and `docs/18` §7 Rule 3 forbid it — the gap creates the incentive |
| Secondary risk | **`SUPER_ADMIN` over-use** in testing and early operations, contrary to `docs/09` §2.3's least-privilege posture |

**Fail-closed is a safe holding position, not a completed RBAC design.** These must not be reported as equivalent.

---

## 6. HUMAN DECISION MATRIX

Only items genuinely requiring approval. **Estimated: one 30-minute sitting.**

| # | Question | Options | Cells resolved | Recommendation | Approver |
|---|---|---|---|---|---|
| **1** | **Is `users.read_self` an explicit grant (A1) or inherent (A2)?** | A1 / A2 | **7** (or renders them N/A) | **OPEN** — highest leverage; resolve first | Principal Security Architect |
| **2** | Do any staff roles receive `users.read`? | `SUPER_ADMIN` only / named roles | 5 | Recommend `SUPER_ADMIN` only at Phase 1 | Principal Security Architect |
| **3** | Do any staff roles receive `users.write`? | `SUPER_ADMIN` only / named roles | 5 | Recommend `SUPER_ADMIN` only | Principal Security Architect |
| **4** | Does any role besides `SUPER_ADMIN` receive `admin.view_audit_log`? | Yes / No | 5 | Recommend No at Phase 1 | Principal Security Architect |
| **5** | Confirm `auth.manage_mfa` = `SUPER_ADMIN` only | Confirm / Revise | 5 | **Confirm** (`docs/09` §2.8) | Principal Security Architect |
| **6** | Confirm `admin.manage_roles` = `SUPER_ADMIN` only | Confirm / Revise | 5 | **Confirm** (`docs/08` §8) | Principal Security Architect |
| **7** | Confirm `SUPPORT_AGENT` gets `crm.read`, **not** `users.read` | Confirm | — | **Confirm** (§3-F) | Principal Security Architect |
| **8** | `CUSTOMER` authorization model at Phase 1 | Follows Q1 | 6 | Resolve Q1 first | + Product Director |
| **9** | Disambiguate "admin" in `docs/08` §8's "(admin, any user)" | Module / userType / role | — | Prevents recurrence for all 23 remaining keys | Principal Security Architect |
| **10** | Adopt a standing rule: every module Sprint must specify role mappings for keys it introduces, as a `docs/11` §7.1 DoR item | Adopt / Decline | — | **Recommend adopt** — prevents this gap recurring 23 more times | Engineering Director |

---

## 7. Implementation Consequences

| Consequence | Detail |
|---|---|
| Migration `0002` | **Requires no change today.** Correct under either reading of A. Must **not** be edited to add guessed grants |
| After approval | A **new** migration (`0003`) applies the agreed grants — `docs/13` §5.1's `backfill` category, idempotent, with `verify()` |
| Acceptance test step 7 (permission **denied**) | Works today |
| Acceptance test step 11 (permission **granted** to a non-`SUPER_ADMIN`) | **Cannot be demonstrated** until Q1–Q4 resolve |
| `docs/15` §3.1 acceptance criterion | "permission-checked against a protected route" demonstrable only in the negative, or by making the test account `SUPER_ADMIN` — which defeats the test's purpose |

---

## 8. Final Status

# OPEN — HUMAN DECISION REQUIRED

| Metric | Value |
|---|---|
| Cells resolved | **6 of 42 (14%)** |
| Cells OPEN | 36 |
| Structural questions resolved by evidence | 3 of 7 (C, D-partial, F, G) |
| Structural questions requiring decision | 4 (A, B, E, and D's `view_audit_log` half) |
| **Guessed grants introduced** | **0** |
| Migration changed | **No** |

---

*This sheet applies no grant, edits no migration, and modifies no locked document.*
