# Phase 1 — Role → Permission Matrix

**Date:** 2026-08-11
**Status:** **OPEN — HUMAN DECISION REQUIRED** for 36 of 42 cells.
**Purpose:** Establish, from locked-document evidence only, which of the seven roles hold which Phase-1 permission keys. **No permission key was invented. No grant was inferred.**
**Governing rules:** `docs/09_security_architecture.md` §2.2 (fail-closed), §2.4 (taxonomy), §11 rule 6; `docs/18_CLAUDE_CONSTITUTION.md` §7 Rule 3.

---

## 1. Source Evidence

| Source | What it establishes |
|---|---|
| `docs/02_enterprise_architecture.md` §14 | The role table — **explicitly labelled** "a human-readable summary of which permission keys each role is granted, kept here for admin-UI design reference", and explicitly **not** the enforcement mechanism |
| `docs/03_database_design.md` §9.1.2 | `roles.name` enum — the seven role names |
| `docs/03` §9.1.2–9.1.3 | `roles.permissionIds[]` → `permissions.key` is the **enforcement source of truth** |
| `docs/08_api_architecture.md` §8 | The per-module contract table naming each module's permission keys |
| `docs/09_security_architecture.md` §2.2 | Fail-closed: ambiguity resolves to denial |
| `docs/09` §2.3 | Least-privilege review cadence; "No new role is introduced" |
| `docs/09` §2.4 | `<module>.<action>` taxonomy; no bare module-name grants |
| `docs/09` §2.8 | MFA re-verification is performed by a `SUPER_ADMIN` |

**Extraction method:** every permission-key-shaped token (`<module>.<action>`) was mechanically extracted from `docs/01`–`18`, then filtered to the 15 locked module names and the `docs/09` §2.4 action taxonomy. **29 keys** are explicitly defined platform-wide.

---

## 2. Complete Phase-1 Key List

Six keys, all from `docs/08` §8's `auth` / `users` / `admin` contract rows:

| # | Key | Verbatim source |
|---|---|---|
| 1 | `auth.manage_mfa` | `docs/08` §8 `auth` row — "`auth.manage_mfa` for admin-forced MFA reset" |
| 2 | `users.read_self` | `docs/08` §8 `users` row — "`users.read_self` (implicit for own profile)" |
| 3 | `users.read` | `docs/08` §8 `users` row — "`users.read`/`users.write` (admin, any user)" |
| 4 | `users.write` | `docs/08` §8 `users` row — same |
| 5 | `admin.manage_roles` | `docs/08` §8 `admin` row |
| 6 | `admin.view_audit_log` | `docs/08` §8 `admin` row |

The other **23** explicitly-defined keys belong to modules not yet built (`leads.*`, `crm.*`, `design_projects.*`, `catalog.write`, `cart.*`, `orders.*`, `payments.read`, `reviews.*`, `media.*`, `notifications.read`, `cms.write`, `analytics.read`) and are correctly **not** seeded — `docs/09` §11 rule 6 governs each as its own module is built.

---

## 3. Role Matrix

7 roles × 6 keys = **42 cells. 6 explicit. 36 OPEN.**

| Role | Permission | Evidence | Explicitly defined? | Recommendation | Approval required? |
|---|---|---|---|---|---|
| SUPER_ADMIN | `admin.manage_roles` | `docs/08` §8 `admin` row: "Role/permission management (`SuperAdmin`-only per `02` §14's role table)" | **YES** | GRANT | Confirm only |
| SUPER_ADMIN | `admin.view_audit_log` | `docs/02` §14: "Full access, including User & Role Management" | **YES** | GRANT | Confirm only |
| SUPER_ADMIN | `auth.manage_mfa` | `docs/09` §2.8: MFA re-verification "by a `SUPER_ADMIN`" | **YES** | GRANT | Confirm only |
| SUPER_ADMIN | `users.read` | `docs/02` §14: "Full access, including User & Role Management" | **YES** | GRANT | Confirm only |
| SUPER_ADMIN | `users.write` | `docs/02` §14: same | **YES** | GRANT | Confirm only |
| SUPER_ADMIN | `users.read_self` | `docs/02` §14: "Full access" | **YES** | GRANT | Confirm only |
| SALES_MANAGER | all 6 | `docs/02` §14 says only: "Leads module, read-only Design Projects and Orders" — names no Phase-1 key | **NO** | **OPEN** | **YES** |
| DESIGN_MANAGER | all 6 | `docs/02` §14: "Design Projects (full…), Leads (read/assign), Media" — names no Phase-1 key | **NO** | **OPEN** | **YES** |
| DESIGNER | all 6 | `docs/02` §14: own assigned `design_projects` only — names no Phase-1 key | **NO** | **OPEN** | **YES** |
| CATALOG_MANAGER | all 6 | `docs/02` §14: "Catalog, Inventory, Marketing modules" — names no Phase-1 key | **NO** | **OPEN** | **YES** |
| SUPPORT_AGENT | all 6 | `docs/02` §14: "Orders (read + limited actions…), Customers (read)" — names no Phase-1 key. **See §4.1** | **NO** | **OPEN** | **YES** |
| CUSTOMER | all 6 | **Not present in `docs/02` §14's table at all** — the table lists six roles; `CUSTOMER` exists only in `docs/03` §9.1.2's enum | **NO** | **OPEN** | **YES** |

---

## 4. Explicit vs. Inferred — Where the Line Was Drawn

Only a statement that **names a Phase-1 permission key, or names the capability that key represents in the same words the locked document uses**, was treated as explicit. Three near-misses were deliberately rejected:

### 4.1 `SUPPORT_AGENT` → `users.read` — REJECTED as an inference

`docs/02` §14 grants `SUPPORT_AGENT` "Customers (read)". It is tempting to map that to `users.read`. **That mapping is wrong on the documents' own terms:**

- `customers` is a **separate collection** in the `crm` module (`docs/03` §9.7.1), not `users`.
- `docs/03` §9.7.1 explicitly notes `customers` "References `auth`'s `users` by ID only, never duplicates identity data".
- `docs/08` §8's `crm` row already provides the matching keys: **`crm.read` / `crm.write`**, on `/admin/customers`.

So "Customers (read)" maps to `crm.read` — a Phase-3 key — **not** to `users.read`. Granting `users.read` here would hand a support agent read access to every staff and admin identity record, which no document authorizes.

### 4.2 `CUSTOMER` → `users.read_self` — REJECTED as an inference (but flagged as most-likely-resolvable)

`docs/08` §8 describes `users.read_self` as "(implicit for own profile)". Two defensible readings exist and the documents do not disambiguate:

- **Reading A:** the key must be explicitly granted in `roles.permissionIds[]` like any other.
- **Reading B:** "implicit" means every authenticated principal has it inherently, and it never appears in a role's grant list.

The two readings imply different code. Choosing one silently would be deciding an authorization model, so it stays **OPEN**. This is the single cheapest item to resolve and the one with the largest functional consequence (§7).

### 4.3 Staff roles → `users.read_self` — REJECTED as an inference

Every staff role plausibly needs to read its own profile, but "plausibly needs" is not evidence. Same open question as §4.2.

---

## 5. Security Analysis

**Current state is secure and correct — but incomplete, and the two must not be confused.**

| Dimension | Assessment |
|---|---|
| Over-permission risk | **None.** 36 unspecified cells are ungranted. This is exactly `docs/09` §2.2's fail-closed requirement |
| Under-permission risk | **High and functional.** Six of seven roles hold zero Phase-1 permissions and can do nothing |
| Taxonomy compliance | ✅ All six keys are `<module>.<action>` per `docs/09` §2.4; no bare module grants |
| Enforcement-source integrity | ✅ Grants live in `roles.permissionIds[]` (`docs/03` §9.1.2), not in a parallel table |
| **Principal residual risk** | **Silent grant-widening under deadline pressure.** With only `SUPER_ADMIN` functional, an implementer running the RBAC acceptance test will be tempted to add grants to make it pass. `docs/09` §11 rule 6 and `docs/18` §7 Rule 3 forbid this, but the gap creates the incentive — this is the failure mode to actively guard against |
| Secondary risk | **`SUPER_ADMIN` over-use.** With one functional role, testing and early operations concentrate on the highest-privilege account, contrary to `docs/09` §2.3's least-privilege posture |

**Fail-closed is not a completed RBAC design.** It is a safe holding position that prevents harm while the design gap remains open. It must not be reported as "RBAC done".

---

## 6. Recommended Mappings

**Only `SUPER_ADMIN`'s six grants are recommended** — and they are already applied by migration `0002-identity-reference-data`, which requires no change.

**No mapping is recommended for the other six roles.** Recommending one would be the guess this document exists to prevent.

What is recommended instead is the *shape* of the decision the approver should make, so the review is a single bounded sitting:

1. Resolve §4.2 first — is `users.read_self` granted or inherent? One answer unblocks all seven roles' self-profile access.
2. Decide, per staff role, whether it holds `users.read` / `users.write`. The realistic candidates are `SUPER_ADMIN` (already granted) and possibly a future dedicated user-administration role. Note `docs/08` §8 describes these as "(admin, any user)" — the word "admin" there is ambiguous between the `admin` **module** and the `ADMIN` **userType**, and that ambiguity should be closed in the same sitting.
3. Confirm `auth.manage_mfa` remains `SUPER_ADMIN`-only, consistent with `docs/09` §2.8.
4. Confirm `admin.*` keys remain `SUPER_ADMIN`-only, consistent with `docs/08` §8.
5. `CUSTOMER` — decide whether it appears in the enforcement model at all beyond §4.2's outcome.

---

## 7. Unresolved Mappings — Implementation Consequences

| Consequence | Detail |
|---|---|
| RBAC acceptance testing | `implementation/01_sprint1_identity_access.md` §11 step 7 (permission **denied**) works today. Step 11 (permission **granted** to a non-`SUPER_ADMIN`) **cannot be demonstrated** |
| `docs/15` §3.1 acceptance criterion | "A `STAFF` account can… be permission-checked against a protected route" — demonstrable only in the negative, or by making the `STAFF` account a `SUPER_ADMIN`, which defeats the test's purpose |
| Customer-facing functionality | If Reading A (§4.2) is correct and `CUSTOMER` receives no grant, **no customer can read their own profile** — `GET /users/me` would 403 for every customer |
| Migration `0002` | **Requires no change.** It is correct as written under either reading. It must **not** be edited to add guessed grants |

---

## 8. Required Approval Authority

**Principal Security Architect** — owns the Security domain (`docs/17` §8) and the permission model specifically (`docs/09` §2.3–2.4).
**Consulted:** Product Director, for the business meaning of each staff role (`docs/02` §14's table is a product-facing artifact).
**Process:** Architecture Review (`docs/11` §8.3, `docs/18` §6.3), recorded as an ADR amending `docs/02` §14 to carry permission keys alongside the prose.

**Recommended governance addition:** make "role mappings specified for every permission key this module introduces" a Definition-of-Ready item (`docs/11` §7.1). Without it, the same gap recurs for all 23 remaining keys as each module is built.

---

## 9. Final Decision Status

# OPEN — HUMAN DECISION REQUIRED

| Metric | Value |
|---|---|
| Phase-1 keys defined | 6 of 6 ✅ |
| Keys seeded in migration `0002` | 6 of 6 ✅ |
| Roles seeded | 7 of 7 ✅ |
| **Role→permission cells explicitly resolved** | **6 of 42 (14%)** |
| Cells OPEN | 36 |
| Guessed grants introduced | **0** ✅ |
| Current security posture | Fail-closed ✅ (safe, not complete) |

**Blocks Sprint 1?** Does not block *building* `auth`/`users`/`admin`. **Does block** RBAC acceptance testing beyond `SUPER_ADMIN`, and therefore full demonstration of the Phase 1 acceptance criterion.

---

*This document defines no permission key not already present in `docs/01`–`18`, recommends no grant not explicitly evidenced, and modifies no locked document or migration.*
