# Rate-Limit Dependency — Governance Decision

**For:** Principal Software Architect (Principal Security Architect consulted)
**Status:** **RECOMMENDED — RETAIN. Confirmation required, no ADR judged necessary.**
**Repository state:** unchanged — packages remain installed pending disposition.

---

## 1. Packages Under Review

| Package | Version | Type | Added |
|---|---|---|---|
| `express-rate-limit` | `^7.4.0` | runtime dependency, `apps/api` | Commit `383df0a` (prerequisite remediation) |
| `rate-limit-redis` | `^4.2.0` | runtime dependency, `apps/api` | Commit `383df0a` |

**Purpose:** implement `core/security/rate-limit.ts`'s `createRateLimiter()` — a generic factory producing Redis-backed rate-limiting middleware. The factory **defines no rate-limit values**; `docs/08` §4.4's tiers are supplied by the module wiring a route.

---

## 2. Locked-Document Evidence

### The capability is locked. Verified across four documents:

| Source | Statement |
|---|---|
| `docs/02` §16 | "Rate limiting \| **Redis-backed, per-IP and per-account**, applied to auth endpoints, lead submission, and public catalog search" |
| `docs/07` §4.2 (Express) | Responsibilities include "middleware pipeline (auth, RBAC, validation, **rate-limit**, error handling)"; and "Helmet, CORS, **rate-limiting**, and CSRF handling are wired as `core/security/` middleware (`06` §4.2), **not framework defaults** — deliberate, not automatic" |
| `docs/07` §7.1 (Redis) | Responsibilities include "**rate-limit counter store**"; the Redis-vs-Node-Cache comparison names rate limiting as a use case that is "**broken by design**" without a shared store |
| `docs/08` §4.4 | Five concrete tiers with exact numeric limits |
| `docs/09` §12.1 | Pre-launch checklist: "All five rate-limit tiers load-tested against their actual limits" |

**The implementing npm package is named nowhere.** Verified: `grep` for `express-rate-limit` / `rate-limit-redis` across all of `docs/01`–`18` returns **zero matches**. `docs/07` has 21 technology categories (§3–§21) and **no rate-limiting category**.

### Decisive precedent — the project's own established practice

Checked which `apps/api` runtime dependencies are named by package name in `docs/07`:

| Package | Mentions in `docs/07` | Locked as | In original Sprint 0 scaffold? |
|---|---|---|---|
| `express` | 7 | Express (§4.2) | ✅ |
| `mongoose` | 5 | Mongoose (§5) | ✅ |
| `zod` | 15 | Zod (§10.1) | ✅ |
| `bullmq` | 5 | BullMQ (§14) | ✅ |
| `pino` | 6 | Pino (§15.1) | ✅ |
| **`ioredis`** | **0** | "Redis" the technology (§7.1) | ✅ **Yes** |
| **`jsonwebtoken`** | **0** | "JWT" the scheme (§6.1) | ✅ **Yes** |
| **`cors`** | 0 as a package lock | "CORS" the control (`docs/02` §16) | ✅ **Yes** |

**`ioredis`, `jsonwebtoken`, and `cors` were all present in the original Sprint 0 scaffold** (verified against commit `56e24bf`'s `apps/api/package.json`) and **none is named by package in `docs/07`.** The project's established, pre-existing practice is therefore explicit: **the locked document names the capability or technology; the specific npm package implementing it is an implementation-detail choice.**

`docs/07` §6.1 confirms this directly for JWT: *"The **JWT library itself** follows Section 1.1; the token *scheme*… is versioned informally"* — treating the library as a versioning concern, not a locked identity.

---

## 3. Governance Assessment

| Question | Answer |
|---|---|
| **1. Explicitly permitted by a locked technology decision?** | The **capability** — yes, unambiguously (§2). The **package** — not named, consistent with `ioredis`/`jsonwebtoken`/`cors` |
| **2. Implementation dependency of an already-approved capability?** | **Yes.** Redis-backed rate limiting is locked in four documents; these packages implement exactly that and introduce no new capability, service, or data store |
| **3. Added without proper governance?** | **No — but it was under-documented at the time.** It was disclosed and flagged for confirmation in `implementation/01_sprint1_prerequisite_remediation.md` §4 and §11 item 4 rather than asserted as settled. This document supplies the evidence that was owed |
| **4. Is an ADR required?** | **Assessed: No.** `docs/18` §2.4 requires an ADR for "a technology… not already named in `docs/07`". Redis (the store) and rate limiting (the control) are both named; these packages add neither. Requiring an ADR here would, for consistency, retroactively require one for `ioredis`, `jsonwebtoken`, and `cors` — which the baseline plainly never intended. **The reviewer may overrule this reading; if so, the packages must be removed pending an ADR.** |
| **5. Can they remain?** | **Recommended yes**, subject to §6 |
| **6. Should they be removed?** | **No** — removal would leave `docs/08` §4.4's five tiers and `docs/09` §12.1's checklist item unimplementable, or force a hand-rolled limiter, which is strictly worse |

---

## 4. Security Implications

| Aspect | Assessment |
|---|---|
| Attack surface | Minimal — middleware operating on request metadata (IP, key), no new network listener, no new data store |
| Correctness under scale | `rate-limit-redis` uses the **shared Redis counter store** `docs/07` §7.1 requires. An in-process limiter would multiply the effective limit by replica count — the exact failure `docs/07` §7.1's Node-Cache comparison calls "broken by design" |
| Supply chain | Two additional direct dependencies. `docs/09` §11 rule 12 requires a reviewer to look at the diff; `docs/10` §5.9's dependency scanning gate applies |
| Failure mode | If Redis is unavailable the limiter's store errors. **Current behavior is unverified** — see §6, item 3. `docs/09` §2.2's fail-closed principle argues limiter-store failure should deny, not silently allow |
| Data handling | Counters keyed by IP/account under a `ratelimit:` namespace; **no PII persisted**; no `docs/09` §1.4 tier applies |

---

## 5. Recommendation

**RETAIN both packages, subject to the confirmations in §6.**

Rationale: they implement a capability locked in four documents, they are the correct architectural choice for a multi-replica deployment (`docs/02` §1/§8), and they sit in the same governance category as three dependencies the original scaffold already established. Removing them would create a gap, not close one.

---

## 6. Conditions Attached to the Recommendation

1. **Record the disposition.** Whatever the reviewer decides, record it — this is the audit trail `docs/18` §5.3 expects.
2. **Consider a `docs/07` housekeeping entry.** Not required by any rule, but adding a short "Rate Limiting" subsection under §7 (Caching) naming the chosen packages would prevent this question recurring. That would itself be an ADR-gated change to a locked document — **recommended but not urgent.**
3. ~~**Verify fail-closed behavior before production**~~ — **CLOSED 2026-08-11. Verified: the limiter FAILS CLOSED.** `express-rate-limit` propagates a rejected `store.increment()` to `next(error)`, so the request terminates in the error handler and **never reaches the route**. Proven by an executed test, not by reading the library: `apps/api/tests/core/security/rate-limit.test.ts` → *"FAILS CLOSED when the counter store is unreachable"*, which injects a store that throws and asserts the response is not 200. This satisfies `docs/09` §2.2. Had it failed open, every auth endpoint would have silently lost brute-force protection precisely while infrastructure was degraded.

   Verifying this required making the store injectable (`createRateLimiter(config, store?)`); the production call path is unchanged and still builds the Redis-backed store. `docs/09` §12.1's load-test item is separate and remains open.
4. **`docs/10` §5.9 dependency scan** must cover both packages before the first real deployment.

---

## 7. Required Approver

**Principal Software Architect** — owns technology-conformance review for implementation-level choices (`docs/17` §8; `docs/18` §2.4).
**Consulted:** Principal Security Architect, on §6 item 3 (fail-closed behavior).

**Escalation:** if the Principal Software Architect judges these to be new technology rather than implementation detail, the decision escalates to the **CTO** (`docs/07`'s owner) and the packages must be removed pending an ADR.

---

## 8. Exact Approval Statement Required

> **The dependencies `express-rate-limit` and `rate-limit-redis` are DISPOSITIONED AS IMPLEMENTATION DETAIL** of the Redis-backed rate-limiting capability already locked in `docs/02` §16 and `docs/07` §4.2/§7.1. No ADR is required. They may remain in `apps/api`. Fail-closed behavior on Redis-store failure is to be verified during Sprint 1.
>
> Approved by: ______________________ (Principal Software Architect), date __________

**Alternative:** *"An ADR IS required"* — in which case both packages are removed from `apps/api/package.json`, `core/security/rate-limit.ts` is withdrawn, and the ADR is drafted for CTO decision.

---

## 9. Status

**RECOMMENDED — CONFIRMATION REQUIRED.** Repository unchanged. Blocks nothing; governance hygiene only.

---

*This document changes no dependency and modifies no locked document.*
