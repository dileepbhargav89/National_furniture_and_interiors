# Technology Decision Record (TDR)
## National Furniture & Interiors Platform

**Prepared by:** Enterprise Technology Review Board
**Date:** 2026-08-07
**Status of `01`–`06`:** LOCKED and approved. This document does not redesign business requirements, runtime architecture, database decisions, repository strategy, or project structure. It documents and validates the technology choices those documents already make, and — where a document named a concern generically without pinning a specific vendor/library (e.g., `02_enterprise_architecture.md`'s "Email/SMS/WhatsApp Adapter" or `06_project_structure.md`'s "e.g., Zustand/Redux" for client state) — this is the document that pins the concrete choice, since that is what a TDR exists to do.
**Scope:** No implementation code — technology evaluation and decision documentation only.

---

## 0. Status Legend

Every technology below is tagged:

- **LOCKED** — already named explicitly in `01`–`06`; this document confirms and documents it, without changing it.
- **NEWLY SPECIFIED** — the concern was named generically in `01`–`06` (a category, an adapter pattern, an illustrative "e.g.") but no specific vendor/library was committed. This document makes that concrete choice for the first time. Making this choice is this document's job, not a redesign of anything already decided.

---

## 1. Governing Principles (Referenced Throughout, Not Repeated Per Technology)

Stated once here so each technology profile below can reference these rather than restate them — the same "don't repeat unchanged content" discipline used throughout `01`–`06`.

### 1.1 General Version Policy

Semver-minor and patch updates are applied automatically via a dependency-update bot (Dependabot or Renovate — tool choice is a Developer Tooling decision, Section 20) after CI passes. Semver-major updates require a manual review PR, changelog read-through, and a full CI run before merge — never auto-merged. Security patches are the one exception to "wait for a batch": a critical CVE affecting a direct dependency is patched out-of-cycle, immediately, regardless of where it falls in the normal update cadence.

### 1.2 Vendor Lock-In / Migration Principle

Every external SaaS dependency (Cloudinary, Razorpay, WhatsApp Business API, the SMS provider, the email provider) is accessed only through the adapter pattern already locked in `02_enterprise_architecture.md` §5–§7 (an `infrastructure/` adapter implementing an `application/`-layer port interface, owned by one feature module). This is the concrete mechanism behind the migration strategy named for every external provider below — swapping a provider means writing a new adapter behind the existing port, not touching the modules that consume it. This principle was already stated as a risk mitigation in `01_business_research.md` §9 ("abstract integrations behind an internal interface so a provider swap doesn't require a platform rewrite"); this document is where it gets applied technology by technology.

### 1.3 Security Baseline

Applies to every technology below without restating it each time: no credential, API key, or secret for any technology is ever committed to the repository (`02_enterprise_architecture.md` §16, `05_repository_strategy.md` §11); every technology choice is evaluated for its fit with the MFA/RBAC/permission-key model locked in `02_enterprise_architecture.md` §14 (v1.1); every technology handling PII is evaluated against the audit-log redaction rule (`03_database_design.md` §9.8.2, v1.1).

### 1.4 Operational Risk Taxonomy

Each technology's "Operational Risks" attribute is tagged against a fixed set of risk categories, so risk profiles are comparable across the whole stack rather than freeform:

| Tag | Meaning |
|---|---|
| **Vendor risk** | Pricing changes, policy changes, service discontinuation, or acquisition by a company with different priorities |
| **Performance risk** | Behavior degrades in a way that's hard to predict from documentation alone (cold starts, connection limits, rate limits) |
| **Talent risk** | Harder to hire for, or the team's own familiarity is a single point of failure |
| **Cost-scaling risk** | Cost grows non-linearly with usage in a way that could surprise the business |
| **Operational-maturity risk** | Requires operational practices (on-call runbooks, capacity planning) the team may not have built yet |

---

## 2. Technology Summary Table

| Category | Technology | Status | One-line rationale | Primary rejected alternative(s) |
|---|---|---|---|---|
| Frontend framework | Next.js 15 | LOCKED | SSR/ISR for a catalog+marketing site, App Router, native Vercel deploy path | Remix, plain Vite+React Router |
| Frontend UI library | React | LOCKED | Ecosystem depth, Shadcn/Next.js dependency | Vue, Svelte |
| Frontend styling | Tailwind CSS | LOCKED | Utility-first, pairs natively with Shadcn | styled-components, CSS Modules |
| Frontend components | Shadcn UI | LOCKED | Owns-the-code component model, not a black-box library | MUI, Chakra UI |
| Frontend state (server) | TanStack Query | NEWLY SPECIFIED | Caching/revalidation for API data, resolves the ISR/Redis dual-cache pattern's client side | SWR |
| Frontend state (client UI) | Zustand | NEWLY SPECIFIED | Minimal boilerplate for cart/filter/wizard UI state | Redux Toolkit, Context API alone |
| Backend runtime | Node.js | LOCKED | Single language (TypeScript) across the stack | Deno, Bun |
| Backend framework | Express.js | LOCKED | Unopinionated, matches the hand-rolled Clean Architecture layering already locked | Fastify, NestJS |
| Language (both stacks) | TypeScript | LOCKED | Compile-time contract enforcement for `@nfi/shared` types | Plain JavaScript |
| Database | MongoDB | LOCKED | Document model fits the embed/reference design in `03_database_design.md` | PostgreSQL |
| ODM | Mongoose | LOCKED | Schema validation + repository pattern support | Native MongoDB driver, Prisma |
| Auth tokens | JWT (access+refresh) | LOCKED | Stateless API auth with Redis-backed revocation | Server-side sessions |
| Password hashing | bcrypt | LOCKED | Industry-standard, adaptive cost factor | argon2, scrypt |
| MFA | TOTP | LOCKED (v1.1) | Standard, no SMS-delivery cost/reliability dependency | SMS OTP as the *only* factor |
| Cache | Redis | LOCKED | Shared state across horizontally-scaled API containers | In-process (Node-Cache) |
| Media storage/CDN | Cloudinary | LOCKED | Signed uploads + on-the-fly transformation | S3 + CloudFront, ImageKit |
| Payments | Razorpay | LOCKED | India-first gateway, webhook-verified pattern already built | Stripe, PayU |
| Validation | Zod | LOCKED | Shared schema for backend validation *and* frontend forms | Joi, Yup |
| Search (MVP) | MongoDB `$text` index | LOCKED | Correct baseline for current catalog scale (`03_database_design.md` §10.4) | A dedicated search service, prematurely |
| Search (future, unpicked) | Elasticsearch / Meilisearch / Typesense / Algolia | Not decided — named as candidates only | Triggered decision, not speculative | — |
| Email | Resend | NEWLY SPECIFIED | Modern DX, good Next.js-ecosystem fit, transactional-focused | AWS SES, SendGrid, Postmark |
| WhatsApp | WhatsApp Business API (Meta) | LOCKED | Named directly in `02_enterprise_architecture.md` | — |
| SMS | MSG91 | NEWLY SPECIFIED | India-first, built for DLT registration compliance | Twilio |
| Logging | Pino | LOCKED | Named as the example in `02_enterprise_architecture.md` §16 | Winston |
| APM/metrics | Grafana Cloud (or self-hosted Grafana+Prometheus+Loki) | NEWLY SPECIFIED | Cost-effective for current team size, open-source foundation | Datadog, New Relic |
| Error tracking | Sentry | NEWLY SPECIFIED | Purpose-built for error tracking, distinct from APM | Bugsnag, Rollbar |
| Unit/integration test runner | Vitest | NEWLY SPECIFIED | Fast, native TypeScript/ESM, low-config in this stack | Jest |
| E2E test runner | Playwright | LOCKED | Named directly in `04_architecture_decision.md` §10.10 | Cypress |
| CI/CD | GitHub Actions | LOCKED (strongly implied) | `.github/` already the named folder in `06_project_structure.md` §7.3 | GitLab CI, CircleCI, Jenkins |
| Deployment (frontend apps) | Vercel | NEWLY SPECIFIED | Native Turborepo remote-cache synergy already flagged in `05_repository_strategy.md` | Self-hosted Next.js, Netlify |
| Deployment (api/worker) | AWS ECS Fargate | NEWLY SPECIFIED | Serverless containers, less ops burden than self-managed Kubernetes for this team size | Kubernetes (EKS), Railway/Render |
| Package manager | pnpm | LOCKED | Set in `05_repository_strategy.md` §4.1 | npm, Yarn |
| Build orchestration | Turborepo | LOCKED | Set in `05_repository_strategy.md` §5 | Nx |
| Linting | ESLint | LOCKED (implied) | Module-boundary rule already relied upon in `05`/`06` | Biome |
| Formatting | Prettier | NEWLY SPECIFIED | Standard pairing with ESLint | dprint |
| Documentation | Markdown + Mermaid.js | LOCKED (by consistent use across `00`–`06`) | In-repo, versioned alongside code | Confluence, Notion, standalone Docusaurus site |

---

## 3. Frontend Stack

### 3.1 Next.js 15 — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Full-stack React framework providing the App Router, SSR/ISR rendering, and the route structure both `storefront` and `admin` are built on (`02_enterprise_architecture.md` §2, §4) |
| Responsibilities | Route rendering (`app/`, per `06_project_structure.md` §3.2), the on-demand ISR revalidation step added in the v1.1 remediation (`02_enterprise_architecture.md` §12, resolving finding P1), `middleware.ts` route guards |
| Enterprise benefits | Native Vercel deployment path (Section 19.1); large ecosystem reduces custom-build burden for routing, image optimization, and edge middleware |
| Performance characteristics | ISR serves cached HTML with background revalidation — fast for catalog/marketing pages; SSR pages pay a per-request render cost, reserved for pages needing live data |
| Scalability | Stateless rendering — horizontally scalable by adding replicas (`02_enterprise_architecture.md` §8.1); no server-side session state to coordinate |
| Security | Middleware-based route gating (`06_project_structure.md` §3.2); `NEXT_PUBLIC_`-prefix convention is the enforced boundary preventing backend secrets from leaking into the client bundle (`05_repository_strategy.md` §11) |
| Advantages | One framework for both apps, consistent mental model; first-class Turborepo integration (`05_repository_strategy.md` §4.2) |
| Trade-offs | Framework opinions (routing conventions, server/client component boundary) constrain how the team structures pages; App Router's server-component model has a real learning curve for a team new to it |
| Known limitations | ISR revalidation is eventually consistent by design — the v1.1 fix (§12) narrows the staleness window but doesn't eliminate it instantaneously; App Router caching semantics have historically been a source of developer confusion industry-wide |
| Rejected alternatives | **Remix** — comparable SSR capability, smaller ecosystem, no equivalent to Next.js's ISR for the catalog-page caching pattern already locked. **Plain Vite + React Router** — would require hand-building SSR, image optimization, and the routing conventions Next.js provides out of the box; rejected as unnecessary custom-build burden for a small team (same "avoid custom-building what a mature framework already solves" reasoning applied to DI in `02_enterprise_architecture.md` §7.3) |
| Migration strategy | Framework-level migration would be a significant rewrite — not abstracted behind an interface the way external SaaS providers are (Section 1.2 doesn't apply to framework choice). Risk is mitigated by choosing a framework with a large, stable ecosystem rather than by an abstraction layer |
| Version policy | Follows Section 1.1. Major version upgrades (e.g., 15 → 16) get a dedicated review cycle given App Router's history of behavioral changes across majors |
| Maintenance considerations | Both `storefront` and `admin` must be upgraded together to avoid `@nfi/ui` needing to support two incompatible Next.js versions simultaneously (`06_project_structure.md` §3's shared-template principle) |
| Operational risks | **Performance risk** (ISR cache-invalidation correctness, actively mitigated by the v1.1 fix); **Talent risk** (App Router is newer than Pages Router — training/hiring should account for this) |

### 3.2 React — LOCKED (condensed)

| Attribute | Detail |
|---|---|
| Purpose | UI rendering library underlying Next.js and `@nfi/ui` |
| Advantages | Largest component/library ecosystem; Shadcn UI (Section 3.4) is built specifically for React |
| Trade-offs | Requires disciplined component boundaries to avoid prop-drilling — mitigated by the feature-folder + `@nfi/ui` split already locked in `06_project_structure.md` §3 |
| Rejected alternatives | **Vue** — comparable capability, but Shadcn UI and the broader component ecosystem the team is drawing from are React-first. **Svelte** — smaller ecosystem, less hiring depth |
| Known limitations | None specific to this platform beyond what's already managed by the locked component/feature structure |
| Version policy / Maintenance | Follows Next.js's supported React version — not independently upgraded (Section 3.1) |
| Operational risks | **Talent risk** — mitigated by React's continued position as the largest-hiring-pool frontend library |

### 3.3 Tailwind CSS — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Utility-first styling for both Next.js apps, extended per-app in `styles/` (`06_project_structure.md` §3.2) |
| Responsibilities | Base design tokens live in `@nfi/config` (`06_project_structure.md` §5); app-level `styles/` only overrides |
| Advantages | No context-switching between CSS files and components; design-token consistency enforced by the shared `@nfi/config` base |
| Trade-offs | Utility classes in JSX can reduce readability for very large components without discipline; mitigated by promoting repeated utility clusters into `@nfi/ui` components rather than copy-pasting class strings |
| Known limitations | Class-name verbosity on complex components — a stylistic cost accepted for the consistency benefit |
| Rejected alternatives | **styled-components** — runtime CSS-in-JS cost, weaker fit with Shadcn UI's Tailwind-native components. **CSS Modules** — no shared design-token mechanism as clean as Tailwind's config extension |
| Migration strategy | Not abstracted (styling choice, not a swappable adapter) — a future migration would be a incremental, component-by-component rewrite, not a single-point swap |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Base config changes in `@nfi/config` must be coordinated across both apps (Section 6, `06_project_structure.md` §13 diagram) |
| Operational risks | Low — mature, stable tool; no material risk beyond ordinary dependency maintenance |

### 3.4 Shadcn UI — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Component source for `@nfi/ui` (`06_project_structure.md` §5) |
| Responsibilities | Provides the base primitives (`Button`, `Card`, `Input`, etc.) that `@nfi/ui` wraps and extends |
| Enterprise benefits | **Not a runtime dependency** — Shadcn generates component source code into the repo, so there is no external package version to drift or break; this is a materially different risk profile than a traditional component library |
| Advantages | Full control over generated component code; no black-box styling overrides to fight; naturally Tailwind-native |
| Trade-offs | No automatic upstream bug fixes (the code is copied, not imported) — the team owns maintenance of every generated component going forward |
| Known limitations | Smaller out-of-the-box component catalog than MUI/Chakra; some components require more manual assembly |
| Rejected alternatives | **MUI** — comprehensive component set but a heavier runtime bundle and a design language (Material) that requires more override work to match a furniture/interior-design brand aesthetic. **Chakra UI** — good DX, but same black-box-library trade-off Shadcn was specifically chosen to avoid |
| Migration strategy | Because components are owned source, not a dependency, there's no "migrate away from Shadcn" event in the traditional sense — component-by-component evolution is already the normal maintenance mode |
| Version policy | N/A in the traditional sense — new components are pulled in individually as needed, not bulk-upgraded |
| Maintenance considerations | Since the team owns the generated code, accessibility and cross-browser fixes that a traditional library would ship automatically must be applied manually — a real, ongoing maintenance cost accepted for the control benefit |
| Operational risks | **Talent risk** — team must be comfortable owning component code rather than only consuming a library API |

### 3.5 State Management — NEWLY SPECIFIED

`06_project_structure.md` §3.2 named `store/` as a folder and gave "e.g., Zustand/Redux" as an illustrative example, not a decision. This document makes it concrete, split by the same server-state/client-state distinction `06_project_structure.md` §3.2 already drew ("Server state... never duplicates into `store/`").

**Server state — TanStack Query**

| Attribute | Detail |
|---|---|
| Purpose | Fetching, caching, and revalidating data retrieved through `@nfi/api-client` (`services/`, per `06_project_structure.md` §3.2) |
| Enterprise benefits | Automatic request deduplication and background refetching reduce load on `apps/api`; built-in optimistic-update support for form-heavy admin screens (lead status changes, design-project stage updates) |
| Performance characteristics | Cache-first reads with configurable staleness windows — directly complementary to (not a replacement for) the Redis/ISR caching already locked at the API and page level (`02_enterprise_architecture.md` §12, v1.1) |
| Advantages | Removes the need for hand-written loading/error-state boilerplate per screen; devtools for cache inspection |
| Trade-offs | A third caching layer (alongside Redis and Next.js ISR) — must be reasoned about deliberately so the three don't disagree; mitigated by keeping TanStack Query's cache TTLs shorter than or equal to the API's own cache headers, never longer |
| Known limitations | Not a global client-state store — deliberately not used for UI-only state, which is Zustand's job below |
| Rejected alternatives | **SWR** — comparable capability and also a legitimate choice; TanStack Query selected for its richer mutation API (useful for the multi-step admin workflows in `design-projects` and `orders`) and more capable devtools, not because SWR is deficient |
| Migration strategy | Consumed only through app-level `services/` (`06_project_structure.md` §3.2) — a future swap to SWR would touch that one layer, not `features/*` |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Cache-key conventions should be documented once in `docs/developer-guide/` (`06_project_structure.md` §8) so keys stay consistent across features |
| Operational risks | **Talent risk** — low, one of the two most widely adopted data-fetching libraries in the React ecosystem |

**Client UI state — Zustand**

| Attribute | Detail |
|---|---|
| Purpose | Ephemeral, client-only UI state per `06_project_structure.md` §3.2's `store/` folder — cart drawer open/closed, admin filter selections, multi-step wizard progress |
| Advantages | Minimal boilerplate compared to Redux Toolkit — no actions/reducers/providers ceremony for what is often a handful of primitive values per feature; small bundle size |
| Trade-offs | Less structural enforcement than Redux Toolkit for very large state trees — an acceptable trade given `06_project_structure.md` §3.2 already scopes `store/` to UI-only state, which stays small by design |
| Known limitations | No built-in time-travel debugging as polished as Redux DevTools, though a compatible devtools middleware exists |
| Rejected alternatives | **Redux Toolkit** — more powerful, but real ceremony overhead for what this platform needs `store/` to hold (small, feature-scoped UI state, not a large normalized app-wide store) — the same "avoid a heavier tool than the problem needs" reasoning already applied to DI framework choice in `02_enterprise_architecture.md` §7.3 and Nx in `05_repository_strategy.md` §5. **Context API alone** — sufficient for a handful of values but lacks selector-based re-render optimization, which matters once multiple components read overlapping slices of filter/cart state |
| Migration strategy | Store slices are colocated per feature (`06_project_structure.md` §3.2) — a future swap would be incremental, feature by feature, not a single cutover |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Enforce the "server state never duplicates into `store/`" rule (`06_project_structure.md` §3.2) in code review — this is a discipline risk, not a tooling one |
| Operational risks | **Talent risk** — low; simple enough API that onboarding cost is minimal |

---

## 4. Backend Stack

### 4.1 Node.js — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | JavaScript/TypeScript runtime for `apps/api` and `apps/worker` (`06_project_structure.md` §4) |
| Responsibilities | Executes the Express application and BullMQ worker processes |
| Enterprise benefits | Single language (TypeScript) across frontend and backend, enabling the `@nfi/shared` cross-stack contract package that is the central payoff of the Monorepo decision (`05_repository_strategy.md` §10) |
| Performance characteristics | Non-blocking I/O model fits this platform's mostly I/O-bound workload (DB queries, external API calls to Razorpay/Cloudinary/WhatsApp) well; CPU-bound work (none identified as a bottleneck yet) would be the one workload class where Node is a weaker fit |
| Scalability | Stateless process, horizontally scaled per `02_enterprise_architecture.md` §8.1 |
| Security | Standard Node security practices (dependency vulnerability scanning per `02_enterprise_architecture.md` §17's CI gate) apply |
| Advantages | Largest package ecosystem (npm) of any backend runtime; the same language on both stacks removes an entire class of contract-translation bugs |
| Trade-offs | Single-threaded event loop means a genuinely CPU-heavy task (e.g., large image processing, if ever done server-side rather than via Cloudinary) would block the event loop without careful use of worker threads |
| Known limitations | Not the strongest choice for CPU-bound numerical workloads — not currently a concern for this platform's workload profile |
| Rejected alternatives | **Deno** — improved security/TypeScript-native defaults, but smaller ecosystem and less production track record at this stack's needed maturity. **Bun** — faster runtime benchmarks, but comparatively new for production enterprise use, and the ecosystem-compatibility risk isn't worth taking for zero functional benefit to this specific platform's requirements |
| Migration strategy | Runtime-level migration would be a significant undertaking, not abstracted behind an interface — mitigated by choosing the most mature, widely-supported option rather than an abstraction layer, same reasoning as Next.js (Section 3.1) |
| Version policy | LTS releases only in production, upgraded on the standard LTS cadence; follows Section 1.1 for minor/patch |
| Maintenance considerations | Node LTS end-of-life dates tracked explicitly, upgraded before EOL, not after |
| Operational risks | **Talent risk** — low, Node/TypeScript is one of the deepest hiring pools available |

### 4.2 Express.js — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | HTTP framework for `apps/api`, hosting the Presentation layer of all 15 feature modules (`06_project_structure.md` §4.3) |
| Responsibilities | Routing, middleware pipeline (auth, RBAC, validation, rate-limit, error handling — `02_enterprise_architecture.md` §5) |
| Enterprise benefits | Minimal, unopinionated — doesn't fight the hand-rolled Clean Architecture layering already locked (`02_enterprise_architecture.md` §5–§7); a more opinionated framework would bring its own module system that would need reconciling with the one already designed |
| Performance characteristics | Middleware-chain overhead is small and well-understood; the real performance profile of this platform is dominated by database/external-API latency, not framework overhead |
| Scalability | Stateless, horizontally scaled behind the load balancer (`02_enterprise_architecture.md` §4, §8) |
| Security | Helmet, CORS, rate-limiting, and CSRF handling are wired as `core/security/` middleware (`06_project_structure.md` §4.2), not framework defaults — deliberate, not automatic |
| Advantages | Enormous middleware ecosystem; simplicity keeps the Clean Architecture boundary the actual source of structure, rather than the framework's own conventions competing with it |
| Trade-offs | Provides less out-of-the-box structure than NestJS — the team owns defining and enforcing the module/layer conventions themselves (which `02_enterprise_architecture.md` already does, so this trade-off is already paid for and accounted for, not a new cost) |
| Known limitations | No built-in dependency injection, request validation, or OpenAPI generation — each is deliberately added as its own decision (manual composition root per `02_enterprise_architecture.md` §7.3, Zod per Section 10, OpenAPI as a future item per `00_architecture_review.md` finding A6) |
| Rejected alternatives | **Fastify** — better raw throughput benchmarks, but the throughput difference is not the platform's bottleneck (external API/DB latency dominates), and Express's ecosystem maturity was weighted higher. **NestJS** — built-in DI, module system, and decorators would directly compete with the manual composition root and Clean Architecture layering already locked in `02_enterprise_architecture.md` §5–§7; adopting NestJS now would mean re-deciding architecture this document is explicitly not allowed to touch |
| Migration strategy | The Clean Architecture layering means Presentation-layer framework code (routes/controllers) is the only layer that would need rewriting in a framework swap — `application/`, `domain/`, and `infrastructure/` are framework-agnostic by design (`02_enterprise_architecture.md` §5) |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Middleware pipeline order (auth → RBAC → validation → rate-limit → error handling) is documented once in `docs/development/` and never varies per module, to keep the security baseline (Section 1.3) uniform |
| Operational risks | **Talent risk** — low; **Performance risk** — low, given the workload profile above |

### 4.3 TypeScript (Backend) — LOCKED

Cross-referenced fully under Developer Tooling (Section 20.1), since it's a single decision spanning both stacks, not a backend-specific one. Backend-specific note: `apps/api`'s Presentation-layer DTOs extend `@nfi/shared` types rather than redeclaring them (`06_project_structure.md` §10), which is the concrete mechanism narrowing the contract-drift risk flagged as `00_architecture_review.md` finding A6.

---

## 5. Database

### 5.1 MongoDB — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Primary datastore for all 35 collections across 8 modules (`03_database_design.md` §4) |
| Responsibilities | Persists every domain entity; the embed-vs-reference modeling throughout `03_database_design.md` is built specifically around MongoDB's document model |
| Enterprise benefits | Schema flexibility fits the platform's genuinely varied document shapes (product variants with arbitrary attribute sets, design-project quotations with revision history) without a rigid relational schema needing frequent migrations for every new attribute |
| Performance characteristics | Read-heavy catalog workloads served well by the indexing strategy in `03_database_design.md` §10; the ESR (Equality-Sort-Range) index-ordering rule and covered-query design (§10.7) are specifically MongoDB idioms |
| Scalability | Replica set (minimum 3 nodes) from day one (`03_database_design.md` §14.1); documented sharding candidates and shard keys pre-planned but not required at MVP scale (§14.3) |
| Security | Field-level PII redaction for audit logs (v1.1, §9.8.2); connection via `apps/api/src/core/database/` only — no other process holds database credentials (`06_project_structure.md` §4.2) |
| Advantages | Native support for the embedded-document patterns that make `orders.items` and `carts.items` immutable-snapshot modeling clean (§9.3.1, §9.3.5); native multi-document transactions (used narrowly, §13.1) available on a replica set without extra infrastructure |
| Trade-offs | No native foreign-key enforcement — referential integrity for referenced fields (`productId`, `orderId`, etc.) is an application-layer responsibility, not database-enforced; polymorphic references (`payments.payableId`) require conditional aggregation logic, documented as a known cost in §9.3.6 |
| Known limitations | `$facet` aggregation pipelines for faceted catalog search are CPU-intensive and require explicit caching (already designed, §11.5, `00_architecture_review.md` finding P2 tracked as Medium); Mongo's own `$text` index has no typo-tolerance (§10.4, explicitly framed as a UX trade-off, not just a scale one, per the v1.1 remediation) |
| Rejected alternatives | See the dedicated **MongoDB vs. PostgreSQL** comparison below |
| Migration strategy | The Repository Pattern (`02_enterprise_architecture.md` §7.1) means every module accesses MongoDB only through its own `IRepository<T>` interface — a future datastore migration (for any single module, or system-wide) is theoretically bounded to the `infrastructure/` layer, though in practice a MongoDB → relational migration would still be substantial given how much of the schema design specifically leverages document embedding |
| Version policy | MongoDB 8.0+ target (`03_database_design.md` header); minor version upgrades follow Section 1.1; major version upgrades tested against the full aggregation-pipeline suite before rollout, given aggregation syntax has historically had version-to-version behavior changes |
| Maintenance considerations | Index creation on large existing collections uses background builds or rolling builds on secondaries first (an operational practice flagged but not detailed in `03_database_design.md` §10 — made explicit here) |
| Operational risks | **Performance risk** — tagged explicitly in `00_architecture_review.md` findings D1/D2 (now resolved via atomic reservation + narrow transaction use); **Operational-maturity risk** — replica-set operation (failover, backup/restore testing) requires real operational discipline, tracked in `02_enterprise_architecture.md` §17's checklist |

#### MongoDB vs. PostgreSQL

| Dimension | MongoDB (chosen) | PostgreSQL |
|---|---|---|
| Schema fit | Native fit for the embed-vs-reference design already locked (`03_database_design.md` §8) — product variants, order snapshots, and design-project quotation revisions are naturally variable-shaped documents | Would require either a rigid normalized schema (frequent migrations for every new variant attribute) or a JSONB escape hatch that gives up most of the relational benefit anyway |
| Transactional integrity | Multi-document transactions available and used narrowly where genuinely needed (§13.1) | Native, mature, and the default expectation — a genuine PostgreSQL strength this platform doesn't heavily lean on given most operations are single-document by design |
| Referential integrity | Application-enforced (a real, accepted trade-off, §9.3.6) | Database-enforced foreign keys — a real advantage PostgreSQL has that this platform gives up |
| Reporting/aggregation | `$facet`/`$lookup` pipelines are capable but more verbose and, for heavily relational reporting, less natural than SQL joins | SQL is generally more ergonomic for complex multi-table reporting joins |
| Horizontal scaling | Native sharding built in, pre-planned shard keys already documented (§14.3) | Requires an extension (Citus) or a different architecture (read replicas + partitioning) to reach comparable horizontal write scaling |
| Team fit | Matches the MERN stack already committed to (`02_enterprise_architecture.md` header) | Would introduce a second query paradigm (SQL) alongside the TypeScript-everywhere stack, with no corresponding architectural benefit given the document-shaped data |
| **Decision basis** | Chosen because the actual data shapes this platform needs (variants, snapshots, revision histories, flexible attribute sets) map more naturally to documents than normalized tables, and the stack was already committed to MERN before this TDR — not because MongoDB is unconditionally superior. A relational database would be the better choice for a platform whose core entities were flat and heavily cross-referential; this one's aren't | |

### 5.2 Mongoose — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | ODM layer between `apps/api`'s Infrastructure-layer repositories and MongoDB |
| Responsibilities | Schema definition (the "models" referenced throughout `06_project_structure.md` §4.3), `$jsonSchema`-adjacent validation, the repository implementations behind each module's port interfaces |
| Enterprise benefits | Schema validation at the application boundary complements the database-level `$jsonSchema` validators (`03_database_design.md` §12), providing defense-in-depth consistent with the same principle already applied to Zod (Section 10) |
| Performance characteristics | Adds a modest serialization/validation overhead versus the native driver — accepted for the schema-safety and query-building ergonomics it provides |
| Scalability | No material scalability difference from the native driver at this platform's scale; connection pooling configured centrally (`apps/api/src/core/database/`, per `06_project_structure.md` §4.2) |
| Security | Schema-level type coercion reduces (does not eliminate) the NoSQL-injection risk surfaced by `00_architecture_review.md` finding S3 — Zod validation at the Presentation layer remains the primary control |
| Advantages | Familiar, widely-adopted TypeScript-friendly API; strong middleware/hooks support for cross-cutting model concerns (e.g., the audit-field defaults from `03_database_design.md` §3) |
| Trade-offs | An abstraction layer over the native driver — occasionally requires dropping to raw driver calls for advanced aggregation features or performance-critical paths |
| Known limitations | Schema casting behavior can mask subtle type bugs if not paired with strict TypeScript types from `@nfi/shared` — mitigated by the DTO-extends-shared-types rule (`06_project_structure.md` §10) |
| Rejected alternatives | **Native MongoDB driver directly** — more control, less overhead, but would mean hand-writing the schema-validation and repository-boilerplate Mongoose provides, for every one of the 15 modules — not worth the trade for this team size. **Prisma** — excellent DX and type generation, but Prisma's MongoDB support has historically been less mature than its relational-database support, and its schema-first code-generation model fits less naturally with the module-owned-schema pattern already locked (`02_enterprise_architecture.md` §7.1's "only place `mongoose.Schema` appears is that module's Infrastructure layer") |
| Migration strategy | Fully contained within each module's `infrastructure/` layer (Section 5.1's Repository Pattern point) — a Mongoose-to-native-driver migration would be module-by-module, not a system-wide cutover |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Schema definitions must be kept in sync with the `$jsonSchema` validators (`03_database_design.md` §12) — currently a manual-discipline requirement, worth automating in a future phase if drift becomes a recurring issue |
| Operational risks | **Talent risk** — low, widely known; **Performance risk** — low at this platform's scale, worth revisiting only if a specific query path is profiled as a bottleneck |

---

## 6. Authentication

### 6.1 JWT (Access + Refresh) — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Stateless API authentication across `storefront`, `admin`, and `apps/api` (`02_enterprise_architecture.md` §9) |
| Responsibilities | Access token carries permission-key claims (v1.1 reconciliation, resolving finding S2); refresh token, stored hashed in Redis, enables server-side revocation |
| Enterprise benefits | Stateless verification means any `api` replica can validate a request without a shared session store round-trip on every request — only the refresh flow touches Redis |
| Performance characteristics | Access-token verification is a fast, local signature check — no database round-trip per authenticated request |
| Scalability | Stateless by design, scales with `api` replica count with no additional coordination needed for the access-token check itself |
| Security | Short-lived access token (10–15 min) held in memory, not localStorage; refresh token in an `httpOnly`, `Secure`, `SameSite=Strict` cookie; rotation on every refresh with reuse-detection (`02_enterprise_architecture.md` §9.1); MFA required for STAFF/ADMIN (v1.1, resolving finding S1) |
| Advantages | No shared session-store dependency for the common case (verifying an already-issued access token); clean separation between authentication (this) and authorization (the permission-key RBAC model, §14) |
| Trade-offs | Pure JWTs can't be revoked before expiry — addressed by keeping access tokens short-lived and layering Redis-backed refresh-token revocation on top, which is itself an admission that "stateless" JWT alone is insufficient for this platform's revocation requirements (logout, forced session kill) |
| Known limitations | Token size grows with claim count (permission keys embedded per v1.1) — bounded and monitored, not yet a measured problem at current permission-key counts |
| Rejected alternatives | See the dedicated **JWT vs. Server-Side Sessions** and **JWT vs. Managed Auth Provider** comparisons below |
| Migration strategy | Auth logic is entirely contained in the `auth` module's four layers (`06_project_structure.md` §4.3) — a future migration to a different token scheme or a managed provider would be scoped to that module plus the frontend's `providers/`/`middleware.ts` (`06_project_structure.md` §3.2), not spread across the codebase |
| Version policy | The JWT library itself follows Section 1.1; the token *scheme* (claims shape, TTLs) is versioned informally via the `auth` module's own changelog discipline |
| Maintenance considerations | Signing-secret rotation cadence (flagged as `00_architecture_review.md` finding S6, Low priority, tracked not yet resolved) should be defined before production launch |
| Operational risks | **Security risk** (mitigated extensively via v1.1: MFA, permission-key RBAC, refresh rotation); **Operational-maturity risk** — Redis availability becomes a dependency for logout/revocation to function correctly, not just for caching |

#### JWT vs. Server-Side Sessions

| Dimension | JWT (chosen) | Server-side sessions |
|---|---|---|
| Scalability | Stateless verification — no shared session store lookup on every authenticated request | Requires a shared session store (typically Redis anyway) checked on *every* request, not just refresh |
| Revocation | Harder by design — mitigated with short TTLs + Redis-backed refresh-token revocation (already the chosen mitigation) | Trivial — deleting the session record revokes immediately |
| Cross-service auth | Naturally fits a model where `storefront`, `admin`, and (future) mobile apps all verify the same token independently | Requires every consuming service to hit the shared session store, or a session-sharing mechanism |
| Complexity | Two token types (access/refresh) with rotation logic — genuinely more moving parts than a session cookie | Simpler mental model — one session ID, one store lookup |
| **Decision basis** | Chosen because it fits the multi-app (`storefront` + `admin`, future mobile per `01_business_research.md`'s Phase 2 roadmap) consumption model better than sessions would, and because the "hard to revoke" weakness is directly and deliberately mitigated (short TTL + Redis-backed refresh revocation) rather than ignored — this platform effectively gets session-like revocation control while keeping JWT's stateless-verification benefit for the common case | |

#### JWT vs. Managed Auth Provider (e.g., Auth0, Clerk)

| Dimension | JWT, self-managed (chosen) | Managed auth provider |
|---|---|---|
| Control | Full control over the permission-key RBAC model already locked (`02_enterprise_architecture.md` §14, v1.1) — a bespoke model most managed providers would require working around or paying for a higher tier to support | Faster initial setup, but the platform's permission-key granularity (`leads.read`, `orders.refund`, etc.) may not map cleanly onto the provider's own role model without workarounds |
| Cost | No per-monthly-active-user fee — relevant given this platform's customer base (not just staff) would count toward most providers' MAU pricing | Often billed per MAU — could become a real cost-scaling risk (Section 1.4 tag) as the customer base grows, given Furniture eCommerce is explicitly one of three business lines generating signups |
| Vendor lock-in | None — auth logic is fully owned within the `auth` module | Real — migrating away from a managed provider later means re-implementing everything the provider handled, for every existing user |
| Operational burden | The team owns MFA, password-reset flows, and session management (already fully designed in `02_enterprise_architecture.md` §9) | Provider handles this, reducing initial build effort |
| **Decision basis** | Rejected specifically because of the cost-scaling risk on the customer-facing side (a managed provider's MAU pricing model fits a small internal-tool user base far better than a public eCommerce site with the traffic ambitions in `01_business_research.md`) and because the platform's permission-key RBAC design was already built bespoke in `02_enterprise_architecture.md` before this TDR — adopting a managed provider now would mean reconciling two different authorization models, not just swapping a token issuer | |

### 6.2 bcrypt — LOCKED (condensed)

| Attribute | Detail |
|---|---|
| Purpose | Password hashing for local-auth accounts (`02_enterprise_architecture.md` §9.1) |
| Advantages | Industry-standard, adaptive cost factor allows tuning hash cost as hardware improves without a scheme change |
| Trade-offs | Slower than non-adaptive hashes by design — this is the point, not a defect (deliberately expensive to brute-force) |
| Rejected alternatives | **argon2** — generally considered the more modern, memory-hard choice and a legitimate alternative; bcrypt selected for its longer production track record and simpler operational tuning (single cost-factor parameter). **scrypt** — comparable memory-hardness rationale to argon2, similar reasoning for not choosing it over bcrypt's simplicity |
| Known limitations | 72-byte input truncation is a known bcrypt quirk — not a practical concern for password inputs |
| Version policy / Maintenance | Follows Section 1.1; cost factor reviewed periodically against current hardware capability |
| Operational risks | **Security risk** — low, given correct implementation; the real risk surface is credential-stuffing/brute-force at the API layer, already mitigated by rate limiting (`02_enterprise_architecture.md` §16) |

### 6.3 MFA (TOTP) — LOCKED (v1.1, condensed)

| Attribute | Detail |
|---|---|
| Purpose | Second factor required for all STAFF/ADMIN accounts, added in the v1.1 remediation resolving `00_architecture_review.md` finding S1 |
| Advantages | No per-message cost or delivery-reliability dependency, unlike SMS-based OTP |
| Trade-offs | Requires the user to have a TOTP authenticator app — a real (small) onboarding step for staff, accepted given the sensitivity of admin access to PII/payments/financials |
| Rejected alternatives | **SMS OTP as the sole second factor** — rejected because SMS delivery has real reliability and interception-risk drawbacks compared to TOTP, and because the platform already has an SMS-provider dependency (Section 14.2) it doesn't want to make security-critical |
| Version policy / Maintenance | Standard TOTP (RFC 6238) — no vendor lock-in, any compliant authenticator app works |
| Operational risks | **Operational-maturity risk** — account-recovery process for a staff member who loses their TOTP device needs a documented, secure procedure (an open item, not yet detailed in any locked document) |

---

## 7. Caching

### 7.1 Redis — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Shared cache, session/refresh-token store, rate-limit counter store, and BullMQ queue backend (`02_enterprise_architecture.md` §2) |
| Responsibilities | Cache-aside for catalog reads (§12), refresh-token storage (§9.1), rate-limit state (§16), event-durability outbox relay's queue backend (§16, v1.1) |
| Enterprise benefits | One piece of infrastructure serving four distinct concerns (cache, session store, rate limiter, queue) — reduces the number of moving parts a small ops team has to run, without conflating their *logical* separation (each concern still has its own key namespace and TTL policy) |
| Performance characteristics | Sub-millisecond in-memory reads; the correct tool for the cross-container shared-state problem a horizontally-scaled `api` fleet has |
| Scalability | Vertical scaling sufficient at MVP; clustering path documented as available at scale (`02_enterprise_architecture.md` §8.1) |
| Security | No PII stored beyond hashed tokens and cache keys; access restricted to `apps/api`/`apps/worker` only, never exposed to either frontend app directly |
| Advantages | Purpose-built for exactly this platform's four use cases; mature, well-understood operational profile |
| Trade-offs | An additional piece of infrastructure to run and monitor, versus an in-process alternative — the trade is justified below |
| Known limitations | Data is ephemeral by nature/configuration — anything requiring durability belongs in MongoDB, not Redis (a discipline already reflected throughout `03_database_design.md`'s TTL-index design for genuinely ephemeral collections) |
| Rejected alternatives | See the dedicated **Redis vs. In-Process Cache (Node-Cache)** comparison below. **Memcached** — comparable performance profile for pure caching, but lacks Redis's data structures (lists, sorted sets) needed for rate-limiting counters and BullMQ's queue implementation — would require a second tool for those concerns rather than one |
| Migration strategy | Accessed only through `apps/api/src/core/cache/` (`06_project_structure.md` §4.2) — a future cache-provider swap is scoped to that one adapter |
| Version policy | Follows Section 1.1; managed Redis service in production preferred over self-managed, per `02_enterprise_architecture.md` §8.1's inventory table |
| Maintenance considerations | Persistence settings differ by role (cache vs. queue vs. session store, per `02_enterprise_architecture.md` §17's checklist) — a queue-backing Redis instance losing data mid-outage is a correctness problem the outbox pattern (v1.1) specifically guards against; a pure cache instance losing data is a performance blip, not a correctness problem |
| Operational risks | **Operational-maturity risk** — Redis becomes a genuine dependency for auth revocation and background job processing, not just a "nice to have" cache; an outage has a real (though bounded — most business writes still land in MongoDB, per Section 1.2's outbox pattern) impact |

#### Redis vs. In-Process Cache (Node-Cache)

| Dimension | Redis (chosen) | Node-Cache (in-process) |
|---|---|---|
| Shared state across replicas | Every `api` container reads/writes the same cache — critical given `02_enterprise_architecture.md` §8.1's horizontally-scaled, stateless container design | Each container has its own independent cache — a cache write on one replica is invisible to the others, meaning cache invalidation (already a documented gap fixed in v1.1's ISR work, §12) would be *impossible* to do correctly across replicas, not just harder |
| Refresh-token revocation | Works correctly — any replica can see a revoked token immediately | Would not work at all — a token revoked via one replica would still appear valid on every other replica until that replica's own cache separately expired it |
| Rate limiting | Correct, shared counters across all replicas | Broken by design — each replica would enforce its own independent limit, multiplying the effective rate limit by replica count |
| Operational cost | An additional service to run/monitor | Zero additional infrastructure — the whole appeal |
| Latency | Network hop to Redis (still sub-millisecond on typical deployment topology) | No network hop — marginally faster for a pure read, but this advantage is irrelevant once correctness (above) rules the option out |
| **Decision basis** | Node-Cache isn't a weaker version of the same thing — it's architecturally incompatible with a horizontally-scaled, multi-replica deployment for three of Redis's four use cases here (session/refresh-token store, rate limiting, and correctly shared cache invalidation). It would only be viable for `apps/api` if the platform ran a single container permanently, which directly contradicts the scalability requirements already locked in `02_enterprise_architecture.md` §1/§8 | |

---

## 8. Storage

### 8.1 Cloudinary — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Media storage, CDN delivery, and on-the-fly image transformation for product/portfolio/design-project images (`02_enterprise_architecture.md` §2, §15) |
| Responsibilities | Signed direct-to-Cloudinary uploads for trusted (admin/catalog) media, with server-proxy reserved for untrusted user-generated uploads (§15.1) |
| Enterprise benefits | Removes binary-transit load from `apps/api` entirely for the common (trusted-upload) path — a deliberate architectural choice, not just a vendor pick (§15) |
| Performance characteristics | CDN-backed delivery, on-the-fly responsive image generation avoids needing to pre-generate and store every image size variant manually |
| Scalability | Scales independently of `apps/api`'s own compute — image-heavy traffic (the platform's catalog and portfolio pages are explicitly image-heavy, `03_database_design.md` §14.6) doesn't compete with API request handling |
| Security | Signed upload presets constrained by file type/size even for the trusted path (v1.1 remediation resolving `00_architecture_review.md` finding S5); API secret never exposed to any frontend bundle |
| Advantages | Purpose-built for exactly the "media-heavy catalog + design portfolio" workload this platform has; avoids MongoDB document-size bloat by keeping only URLs/public IDs in the database (`03_database_design.md` §14.6) |
| Trade-offs | A pay-per-transformation/bandwidth SaaS cost that scales with media volume and traffic — a real, ongoing operating cost tied directly to catalog size and site traffic |
| Known limitations | Vendor-specific transformation URL syntax creates a light coupling in any code that constructs image URLs — contained to `packages/api-client` and `apps/api`'s `media` module adapter (Section 1.2's principle) |
| Rejected alternatives | See the dedicated **Cloudinary vs. S3 + CloudFront** comparison below. **ImageKit** — a reasonable, comparable alternative in the same product category as Cloudinary; not chosen primarily because Cloudinary has a longer enterprise track record and the specific signed-upload pattern already designed in `02_enterprise_architecture.md` §15 is directly built around Cloudinary's API shape |
| Migration strategy | Fully isolated to the `media` module's `infrastructure/` adapter (`06_project_structure.md` §7.2) — a provider swap means a new adapter implementing the same port, plus a one-time migration of existing asset URLs, not a change to any module that merely *displays* an image |
| Version policy | SDK/API version follows Section 1.1; upload-preset configuration changes reviewed for the security implications noted in finding S5's remediation |
| Maintenance considerations | Upload-preset constraints (allowed formats, max file size) should be reviewed periodically as new media types are needed (e.g., video for product listings, already anticipated in `03_database_design.md` §9.2.3's `videos` field) |
| Operational risks | **Vendor risk** — pricing-model changes are a real, named risk for any media CDN provider at scale; **Cost-scaling risk** — directly tied to catalog size and traffic growth, worth monitoring as the platform scales past MVP |

#### Cloudinary vs. S3 + CloudFront

| Dimension | Cloudinary (chosen) | S3 + CloudFront |
|---|---|---|
| Transformation | On-the-fly, URL-parameter-driven image transformation built in | Requires a separate image-processing service (e.g., Lambda@Edge or a dedicated resizing service) to be built and maintained |
| Upload pattern | Signed direct-upload already a first-class feature, matching the pattern already designed (§15) | Achievable via S3 pre-signed URLs, comparable pattern, but without built-in transformation |
| Operational burden | Fully managed — no infrastructure to provision or maintain | Requires provisioning and maintaining the CDN distribution, cache-invalidation rules, and (critically) the transformation pipeline S3 doesn't provide natively |
| Cost model | Per-transformation/bandwidth SaaS pricing — simpler to reason about, but potentially more expensive at very large scale than raw S3 storage + bandwidth | Generally cheaper at very large scale for pure storage/bandwidth, but that comparison excludes the cost of building/running the transformation pipeline Cloudinary provides for free |
| **Decision basis** | Chosen because the platform needs on-the-fly transformation (responsive product images, portfolio galleries) as a core requirement, not an optional extra — building that pipeline on top of S3+CloudFront would be real engineering effort with no corresponding benefit to the business, for a team explicitly sized and phased around shipping the MVP fast (`01_business_research.md` §6). Revisit only if Cloudinary's cost profile becomes a measured problem at scale — at which point the migration strategy above (module-isolated adapter) is exactly what makes that revisit affordable | |

---

## 9. Payments

### 9.1 Razorpay — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Payment gateway for furniture-order checkout and interior-design milestone payments (`02_enterprise_architecture.md` §2, §11) |
| Responsibilities | Payment capture, webhook-verified confirmation (the sole source of truth for "paid," never the client-side callback — §11), the polymorphic `payments` collection's `RAZORPAY` gateway value (`03_database_design.md` §9.3.6) |
| Enterprise benefits | India-first gateway with the local payment method coverage (UPI, netbanking) that a global-first gateway would need to bolt on |
| Performance characteristics | Webhook-driven confirmation decouples payment-completion latency from the checkout request path — the checkout API returns as soon as the payment intent is created, not when the payment actually clears |
| Scalability | External SaaS, scales independently of `apps/api` |
| Security | Signature-verified webhooks (`02_enterprise_architecture.md` §11), idempotent handling on `gatewayOrderId`/`paymentId` to prevent double-fulfillment; no raw card data ever touches MongoDB (`03_database_design.md` §16's PCI-DSS scoping note) |
| Advantages | Reserve → external payment → webhook-confirmed commit is the one payment pattern reused identically for both furniture orders and design-project milestones (`02_enterprise_architecture.md` §11, §13) — one integration serving two business lines |
| Trade-offs | India-first focus means weaker fit if the platform ever expands to markets Razorpay doesn't serve well — an explicit, accepted trade-off given `01_business_research.md`'s current India-focused scope |
| Known limitations | Refund flow (v1.1's Return Flow, `02_enterprise_architecture.md` §20) depends on Razorpay's refund API completing within a reasonable window — no control over gateway-side refund processing time |
| Rejected alternatives | See the dedicated **Razorpay vs. Stripe** comparison below. **PayU** — another India-capable gateway, comparable feature set; Razorpay selected for stronger developer-experience reputation and webhook-tooling maturity in the Indian market at the time of the original stack decision (`02_enterprise_architecture.md` header) |
| Migration strategy | Fully isolated to the `payments` module's `infrastructure/` adapter (`06_project_structure.md` §7.2) — the reserve/webhook-confirm *pattern* is gateway-agnostic by design; only the adapter implementation would change |
| Version policy | API version follows Section 1.1; webhook-payload schema changes reviewed against the idempotency-handling logic before adoption |
| Maintenance considerations | Webhook endpoint should have IP-allowlisting for Razorpay's known source ranges as defense-in-depth (flagged as a Low-priority hardening item in `00_architecture_review.md` §7, not yet implemented) |
| Operational risks | **Vendor risk** — payment-gateway outages are a genuine business-continuity concern (flagged in `00_architecture_review.md` finding PR1's degraded-mode recommendation — COD fallback during a Razorpay outage); **Cost-scaling risk** — transaction-fee percentage scales with GMV, a predictable but real cost line |

#### Razorpay vs. Stripe

| Dimension | Razorpay (chosen) | Stripe |
|---|---|---|
| India-market fit | Native UPI, netbanking, and India-specific payment method coverage | Stripe's India support has historically been more limited/evolving than dedicated India-first gateways — a real gap for a platform whose current scope (`01_business_research.md`) is India-focused |
| Developer experience | Comparable webhook/API quality to Stripe for the platform's needs | Stripe is often considered the global DX benchmark, but that edge doesn't offset the India-market-fit gap for this specific platform |
| Global expansion (future) | Weaker fit if `01_business_research.md`'s Phase 3 multi-region expansion becomes real | Stripe would be the stronger choice *if and when* that expansion happens — noted as a future revisit trigger, not a reason to switch now |
| **Decision basis** | Chosen because the platform's approved scope is India-first (`01_business_research.md`'s reference platforms are all India-focused: Wooden Street, Urban Ladder, Pepperfry), and Razorpay's UPI/netbanking coverage directly serves that market better than Stripe would today. Revisit only if/when Phase 3 multi-region expansion (`01_business_research.md` §6) becomes an actual roadmap item — at which point the gateway-agnostic reserve/webhook pattern (Section 9.1) makes adding a second gateway for new markets a bounded, adapter-level change, not a re-architecture | |

---

## 10. Validation

### 10.1 Zod — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Schema validation at the Presentation-layer boundary in `apps/api`, and form validation in both Next.js apps, sharing schemas via `@nfi/shared/validation` (`02_enterprise_architecture.md` §16, `06_project_structure.md` §10) |
| Responsibilities | Request/response DTO validation, NoSQL-injection mitigation via strict primitive typing (v1.1 remediation resolving `00_architecture_review.md` finding S3), form-level client validation |
| Enterprise benefits | One schema definition validates both the server request and the client form — directly closes the class of bug where frontend and backend validation rules silently disagree, the same rationale already applied to `@nfi/shared/enums` (`06_project_structure.md` §10) |
| Performance characteristics | Runtime validation overhead is small and proportional to payload size — not a measured bottleneck at this platform's scale |
| Scalability | No scalability concern distinct from the request-handling path it's part of |
| Security | Strict primitive-type schemas (`z.string()`, not loosely-typed objects) are the explicit, stated mitigation for MongoDB-operator-injection attacks (v1.1, resolving finding S3) — this is a security control, not just a data-shape check |
| Advantages | TypeScript-first — schema definitions double as compile-time types, reducing the type/validation-logic duplication a separately-typed validation library would introduce |
| Trade-offs | Runtime validation is a defense-in-depth layer on top of the domain-layer invariants already enforced in `02_enterprise_architecture.md` §5 — not a substitute for those, meaning validation logic legitimately exists in two places (Presentation-layer Zod schema and Domain-layer entity invariant) by design, not by accident |
| Known limitations | Complex cross-field validation (e.g., `orders.pricing.total` must equal the sum of line items, `03_database_design.md` §12) is deliberately handled in the Application layer, not expressed as a Zod schema — Zod validates shape/type, not business arithmetic |
| Rejected alternatives | See the dedicated **Zod vs. Joi/Yup** comparison below |
| Migration strategy | Schemas live in `@nfi/shared/validation` (`06_project_structure.md` §10) — a validation-library swap is scoped to that one package, consumed identically by both `apps/api` and both frontend apps |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Schema definitions should be updated in the same PR as any corresponding `03_database_design.md` `$jsonSchema` validator change, to keep the two defense-in-depth layers from drifting apart |
| Operational risks | Low — mature, widely adopted, no material operational risk beyond ordinary dependency maintenance |

#### Zod vs. Joi/Yup

| Dimension | Zod (chosen) | Joi | Yup |
|---|---|---|---|
| TypeScript integration | Schema *is* the type — `z.infer<typeof schema>` generates the TypeScript type directly, zero duplication | Requires separately maintained TypeScript types alongside the validation schema | Better TS support than Joi but still not as tightly integrated as Zod's inference model |
| Cross-stack sharing | Same schema runs identically in `apps/api` (Node) and both Next.js apps (browser) — no environment-specific behavior gaps | Historically more Node-oriented; browser bundle size and behavior parity require more care | Commonly used in frontend form libraries (e.g., historically paired with Formik) — reasonable browser fit, weaker backend-shared-schema story |
| Ecosystem fit | Native fit with the `@nfi/shared` cross-stack contract package already locked (`06_project_structure.md` §10) | Would still work but loses the type-inference benefit that makes Zod's fit tighter | Comparable ecosystem position to Zod for frontend-only use, but the cross-stack sharing goal favors Zod |
| **Decision basis** | Chosen specifically because `@nfi/shared/validation` needs one schema definition to serve both backend request validation and frontend form validation with matching TypeScript types — Zod's type-inference model is the direct enabler of that shared-package design already locked in `06_project_structure.md` §10, not a generic "Zod is better" preference | | |

---

## 11. State Management

See Section 3.5 — a frontend-only concern, fully specified there (TanStack Query for server state, Zustand for client UI state).

---

## 12. Search

### 12.1 MongoDB `$text` Index — LOCKED (MVP)

| Attribute | Detail |
|---|---|
| Purpose | Free-text catalog and blog search fallback at MVP scale (`03_database_design.md` §10.4) |
| Responsibilities | Backs the storefront's product search box and blog search until traffic/catalog size justifies a dedicated service |
| Enterprise benefits | Zero additional infrastructure — search capability exists from day one without a separate service to provision, deploy, or keep in sync with MongoDB |
| Performance characteristics | Adequate for the current catalog scale target (`01_business_research.md`'s MVP framing); does not scale gracefully to very large catalogs or high query-per-second search loads |
| Scalability | The known ceiling of this choice — explicitly why it's framed as an MVP baseline, not a permanent decision |
| Security | No distinct security profile from the rest of MongoDB (Section 5.1's security baseline applies) |
| Advantages | No sync pipeline to build/maintain between MongoDB and a separate search index — the data is always current by construction |
| Trade-offs | No typo-tolerance, no relevance-tuning sophistication, no faceted-search performance beyond what `$facet` aggregation provides (already flagged as needing caching, `00_architecture_review.md` finding P2) |
| Known limitations | This was reframed in the v1.1 remediation as a **day-one UX trade-off, not only a future-scale one** (`03_database_design.md` §10.4, resolving finding P4) — worth being explicit that the MVP team is making an informed trade, not an oversight |
| Rejected alternatives | A dedicated search service, deliberately **not chosen yet** — see Section 12.2 |
| Migration strategy | Search queries are already isolated behind the `catalog` module's Application-layer service interface (`02_enterprise_architecture.md` §7.1's narrow repository interfaces) — swapping the search backend means a new implementation behind that interface, not a change to any consuming code |
| Version policy | Follows MongoDB's own version policy (Section 5.1) |
| Maintenance considerations | Text-index field selection (`name`, `description`, `tags`, `material` per `03_database_design.md` §10.4) should be revisited if search-relevance complaints emerge before the Phase 2 extraction trigger is otherwise met |
| Operational risks | **Performance risk** — the known, accepted ceiling; monitored via the same trigger-based extraction discipline already established (`04_architecture_decision.md` §9.1's readiness checklist) |

### 12.2 Future Dedicated Search Service — Not Decided (Named Candidates Only)

Consistent with the platform's established discipline of not deciding ahead of a trigger (`04_architecture_decision.md` §9.1, §5.4), no specific search service is picked here. Named as candidates for the Phase 2 extraction already ranked in `04_architecture_decision.md` §9.2:

| Candidate | Profile |
|---|---|
| **Elasticsearch** | Most powerful and most flexible; highest operational burden (cluster management) unless using a managed offering |
| **Algolia** | Excellent developer experience and typo-tolerance out of the box, hosted; real cost-scaling risk at high query volume and a vendor-lock-in profile similar to the one weighed for Cloudinary (Section 8) |
| **Meilisearch** | Lighter self-hosted footprint than Elasticsearch, good typo-tolerance, smaller ecosystem/community than Elasticsearch |
| **Typesense** | Similar profile to Meilisearch — open-source, fast, simpler ops than Elasticsearch |

**This decision is deferred, not avoided** — per `04_architecture_decision.md` §9.1's extraction-readiness checklist, it should be made when the trigger (search relevance/performance complaints, or catalog size outgrowing `$text` index performance) is actually measured, not speculatively now.

---

## 13. Email

### 13.1 Resend — NEWLY SPECIFIED

`02_enterprise_architecture.md` never named a specific email vendor — only "Email Service" generically (§2) and "Email/SMS/WhatsApp Adapter" as a pattern (§16). This pins the concrete choice.

| Attribute | Detail |
|---|---|
| Purpose | Transactional email delivery (order confirmations, lead-nurture sequences, password-reset, MFA-adjacent notices) via the `notifications` module's adapter (`06_project_structure.md` §4.3) |
| Responsibilities | One of three notification channels alongside WhatsApp (Section 14.1) and SMS (Section 14.2), all behind the same `INotificationChannel` port already designed in `02_enterprise_architecture.md` §5 |
| Enterprise benefits | Modern developer experience reduces integration time; React-Email-compatible templating fits naturally with the TypeScript-everywhere stack |
| Performance characteristics | Async delivery via the BullMQ worker (`02_enterprise_architecture.md` §16) — email sending never blocks the request path that triggers it |
| Scalability | External SaaS, scales independently; the platform's own bottleneck (if any) would be worker throughput, not the provider |
| Security | API key held only in `apps/api`'s environment, never exposed to frontend bundles (Section 1.3's baseline); DKIM/SPF/DMARC configuration is a deployment-time concern tracked in `docs/deployment/` (`06_project_structure.md` §8) |
| Advantages | Purpose-built for transactional (not marketing-blast) email, which matches this platform's actual usage pattern closely |
| Trade-offs | Newer entrant than SES/SendGrid — shorter production track record at extreme scale, though more than adequate for this platform's current and near-term volume |
| Known limitations | Marketing/bulk-send tooling is less mature than dedicated marketing-email platforms — not a gap for this platform's current scope, since bulk marketing email isn't yet a designed feature in `01`–`06` |
| Rejected alternatives | See the dedicated **Resend vs. AWS SES vs. SendGrid vs. Postmark** comparison below |
| Migration strategy | Isolated to the `notifications` module's email adapter (Section 1.2's principle) — a provider swap doesn't touch the lead-nurture or order-confirmation business logic that triggers the send |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Email templates should live in `assets/email-templates/` (`06_project_structure.md` §7.2's assets breakdown) as source, rendered by the `notifications` module |
| Operational risks | **Vendor risk**, **Cost-scaling risk** (tied to send volume, predictable) |

#### Resend vs. AWS SES vs. SendGrid vs. Postmark

| Dimension | Resend (chosen) | AWS SES | SendGrid | Postmark |
|---|---|---|---|---|
| Cost at scale | Competitive at this platform's volume; not the cheapest at extreme scale | Cheapest raw sending cost at very high volume | Mid-range | Mid-to-higher, priced for deliverability-critical transactional use |
| Developer experience | Modern, TypeScript/React-Email-friendly | Minimal DX layer — closer to raw infrastructure | Mature but heavier API surface | Comparable DX quality to Resend, transactional-focused |
| Deliverability tooling | Adequate for transactional volume | Requires more manual reputation-management setup | Strong, mature deliverability tooling | Excellent — often cited as the deliverability benchmark for transactional email specifically |
| **Decision basis** | Chosen for developer-experience fit with the existing TypeScript stack and adequate deliverability for transactional (not marketing-blast) volume; AWS SES is the stronger choice purely on cost-at-extreme-scale and is worth revisiting if send volume grows large enough to make the cost delta material — the adapter-isolation strategy (Section 1.2) makes that revisit cheap when/if it's warranted | | | |

---

## 14. Notifications

### 14.1 WhatsApp Business API (Meta) — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | WhatsApp channel for lead confirmations, nurture sequences, and order/design-project updates (`02_enterprise_architecture.md` §2, §10, §16) |
| Responsibilities | One of the three notification channels; gated on `marketingConsent` for marketing-purpose messages (v1.1, resolving finding B4) |
| Enterprise benefits | The dominant messaging channel for the platform's target market (India, per `01_business_research.md`'s competitive set) — higher open/engagement rates than email for this demographic and use case |
| Security | Consent tracking (v1.1) is the explicit, load-bearing compliance control for this channel specifically — WhatsApp marketing messages without documented consent are a real DPDP Act/TRAI exposure (`00_architecture_review.md` finding B4) |
| Advantages | Official Meta API — not a third-party unofficial wrapper, avoiding the account-ban risk unofficial WhatsApp automation tools carry |
| Trade-offs | Message-template approval process (Meta must approve business-initiated message templates in advance) adds lead time to launching new notification types — a real, ongoing operational constraint |
| Known limitations | 24-hour customer-service-window rules govern which message types can be sent outside an approved template — a Meta platform constraint, not a design choice |
| Rejected alternatives | Third-party/unofficial WhatsApp automation tools — rejected outright given the account-ban risk and the compliance/consent rigor already designed around this channel (v1.1) would be undermined by an unofficial, less auditable integration |
| Migration strategy | Isolated to the `notifications` module's WhatsApp adapter (Section 1.2) |
| Version policy | Follows Meta's own API versioning; monitored for template-policy changes |
| Maintenance considerations | Template library (approved message formats) needs active management as new notification types are added |
| Operational risks | **Vendor risk** — named explicitly in `01_business_research.md` §9's risk table ("WhatsApp Business API policy/pricing changes") with the mitigation already stated there (fallback to SMS/email if WhatsApp delivery is disrupted, which this document's adapter-per-channel design directly enables) |

### 14.2 SMS Provider — MSG91 — NEWLY SPECIFIED

| Attribute | Detail |
|---|---|
| Purpose | SMS fallback/channel for OTP and notifications where WhatsApp/email aren't appropriate or available (`02_enterprise_architecture.md` §16's fallback-channel principle) |
| Responsibilities | OTP delivery for the `otp_verifications` collection flow (`03_database_design.md` §9.1.5), SMS-channel notifications gated on consent (v1.1) |
| Enterprise benefits | India-focused provider built around DLT (Distributed Ledger Technology) registration — India's TRAI-mandated sender/template registration requirement for commercial SMS, which every SMS provider serving Indian numbers must support, but India-first providers have more mature tooling for |
| Security | DLT template registration is itself a compliance control — an unregistered/non-compliant SMS send is both a delivery failure and a regulatory exposure, tying directly to the same consent-and-compliance discipline established for WhatsApp (Section 14.1) and the marketing-consent field (v1.1, `03_database_design.md` §9.5.1) |
| Advantages | Purpose-built for the Indian SMS regulatory environment, which a global-first provider would require more manual configuration to satisfy |
| Trade-offs | Smaller global footprint than Twilio — a real constraint if `01_business_research.md`'s Phase 3 multi-region expansion becomes actual roadmap |
| Rejected alternatives | See the dedicated **MSG91 vs. Twilio** comparison below |
| Migration strategy | Isolated to the `notifications` module's SMS adapter (Section 1.2) |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | DLT template registrations must be kept current with actual message content — a compliance-adjacent maintenance task, not just a technical one |
| Operational risks | **Vendor risk**; **Compliance risk** (DLT non-compliance would block SMS delivery entirely, not just degrade it) |

#### MSG91 vs. Twilio

| Dimension | MSG91 (chosen) | Twilio |
|---|---|---|
| India DLT compliance | Built around India's DLT registration requirements as a core part of the product | Supports India delivery but DLT-specific tooling/guidance is comparatively less India-native |
| Cost for India-only volume | Generally more cost-effective for India-concentrated SMS volume | Global pricing model, often less competitive for India-specific routing at this platform's current, India-focused scope |
| Global reach (future) | Weaker than Twilio outside India | Twilio's global carrier relationships are the stronger choice if/when multi-region expansion (`01_business_research.md` §6, Phase 3) becomes real |
| **Decision basis** | Same reasoning pattern as the Razorpay decision (Section 9.1's comparison): the platform's currently-approved scope is India-first, and MSG91's DLT-native tooling directly serves that scope better today. Revisit at the same Phase 3 multi-region trigger, using the same adapter-isolation migration path | |

---

## 15. Logging

### 15.1 Pino — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | Structured JSON logging across `apps/api` and `apps/worker`, named as the example choice in `02_enterprise_architecture.md` §16 |
| Responsibilities | Correlation/request-ID propagation from Nginx through the API to worker jobs (`02_enterprise_architecture.md` §16), the redaction-aware logging discipline that pairs with the audit-log PII-redaction rule (v1.1, `03_database_design.md` §9.8.2) |
| Enterprise benefits | Structured (JSON) log output is directly consumable by any log-aggregation backend without a custom parser — keeps the logging *format* decoupled from the logging *destination* decision |
| Performance characteristics | Widely benchmarked as one of the fastest Node.js logging libraries — meaningfully lower per-log-call overhead than console-based logging or heavier structured loggers |
| Scalability | No material scalability concern of its own — log volume scales with request volume, handled by the log-aggregation backend (Section 16.1), not by Pino itself |
| Security | Supports field redaction natively — directly usable for the audit-log PII-redaction requirement (v1.1) and for keeping secrets out of application logs generally |
| Advantages | Low overhead, structured output, mature ecosystem of transports for shipping logs to any backend |
| Trade-offs | Raw JSON output is not human-friendly in a local terminal without a pretty-printing transport in development — a minor DX cost, solved with a dev-only formatter |
| Known limitations | Logging itself doesn't solve log aggregation/search/retention — that's the separate Monitoring decision (Section 16) |
| Rejected alternatives | **Winston** — more plugin flexibility (multiple simultaneous transports, more configuration surface) but measurably slower than Pino and more configuration than this platform's needs justify — same "avoid a heavier tool than the problem needs" pattern applied elsewhere (Sections 3.5, 5.2) |
| Migration strategy | Centralized in `apps/api/src/core/logger/` (`06_project_structure.md` §4.2) — every module logs through this one factory, so a logger swap is a single-file change |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Redaction field list (Section 1.3) must be kept in sync with any new field added to `users`, `payments`, or other PII-bearing collections |
| Operational risks | Low — mature, stable, purpose-fit tool |

---

## 16. Monitoring

### 16.1 APM/Metrics — Grafana Cloud (or self-hosted Grafana + Prometheus + Loki) — NEWLY SPECIFIED

`02_enterprise_architecture.md` §16–§17 named "APM tracing," "Metrics/APM," and "uptime/error monitoring" as required capabilities without naming a vendor. This pins the concrete choice.

| Attribute | Detail |
|---|---|
| Purpose | Request tracing across API → DB/Redis/external-call spans, container health/readiness observability, uptime alerting (`02_enterprise_architecture.md` §16–§17) |
| Enterprise benefits | Open-source foundation (Prometheus for metrics, Loki for logs, Grafana for visualization) avoids the vendor lock-in a proprietary APM would introduce, while Grafana Cloud's managed offering removes the self-hosting operational burden for a small team — the team can start managed and self-host later if cost or control considerations change, without a tooling rewrite |
| Performance characteristics | Metrics scraping/collection overhead is well-understood and tunable (scrape interval trade-offs between granularity and load) |
| Scalability | Scales with the platform; managed tier removes the "can our small ops team run a Prometheus cluster reliably" question at MVP stage |
| Security | Dashboards/alerts access-controlled separately from the application's own RBAC — an infrastructure-team concern, not a `02_enterprise_architecture.md` §14 concern |
| Advantages | Correlates directly with the structured Pino logs (Section 15.1) and the correlation-ID propagation already designed |
| Trade-offs | A managed-then-self-host path is more setup work upfront than committing to one model, but avoids a forced migration later if the team's operational maturity or cost sensitivity changes |
| Known limitations | Distributed tracing depth (span-level detail across service boundaries) matures with instrumentation effort — an ongoing investment, not a one-time setup |
| Rejected alternatives | See the dedicated **Grafana Stack vs. Datadog vs. New Relic** comparison below |
| Migration strategy | Standard OpenTelemetry instrumentation (where used) keeps trace/metric emission vendor-neutral — the visualization/alerting backend can change without re-instrumenting application code |
| Version policy | Follows Section 1.1 for the self-hosted components; managed-tier version handled by the provider |
| Maintenance considerations | Alert-threshold tuning (the rollback-trigger criteria flagged as unresolved in `00_architecture_review.md` finding PR4) should be defined using this tooling once it's in place |
| Operational risks | **Operational-maturity risk** — self-hosting the full stack later requires real ops capability; **Cost-scaling risk** on the managed tier at high metric/log cardinality |

#### Grafana Stack vs. Datadog vs. New Relic

| Dimension | Grafana stack (chosen) | Datadog | New Relic |
|---|---|---|---|
| Cost | Open-source core, pay-as-you-need managed tier | Premium pricing, scales quickly with hosts/metrics volume | Comparable premium pricing to Datadog |
| Vendor lock-in | Low — Prometheus/Loki are open standards, portable to self-hosted at any time | High — proprietary agent/query language | High — proprietary agent/query language |
| Feature breadth | Strong for metrics/logs/dashboards; APM tracing requires more manual instrumentation than a purpose-built commercial APM | Extremely broad, polished, minimal-setup APM/tracing/RUM | Comparable breadth to Datadog |
| Team-size fit | Matches the small-team, cost-conscious premise already established throughout `04`/`05` for tooling decisions | Better suited to teams with budget for premium observability and less time to configure open-source tooling | Same as Datadog |
| **Decision basis** | Chosen using the same reasoning already applied consistently across this TDR (Sections 3.5, 5.2, 15.1): pick the tool sized to the team and stage, not the most feature-complete option on paper. The cost-scaling and vendor-lock-in profile of Datadog/New Relic is a real risk for a platform still in its MVP-to-Phase-1 window (`01_business_research.md` §6) — revisit if/when the team's operational budget and headcount grow enough to justify a premium managed APM's reduced setup burden | | |

### 16.2 Error Tracking — Sentry — NEWLY SPECIFIED

| Attribute | Detail |
|---|---|
| Purpose | Application error tracking and alerting — a distinct concern from APM/metrics (Section 16.1), covering unhandled exceptions and error-boundary captures in both frontend apps and `apps/api` |
| Enterprise benefits | Purpose-built for exactly "what broke, for which user, on which release" — a different question than "is the system healthy" (APM's job) |
| Advantages | Native Next.js and Node integration reduces setup effort; release-tracking ties errors to the git-SHA-tagged deployments already designed (`05_repository_strategy.md` §12) |
| Trade-offs | A second observability tool alongside the Grafana stack (Section 16.1) — justified because error tracking and metrics/tracing are genuinely different workflows (a developer debugging a specific crash wants Sentry's stack-trace-and-breadcrumb view, not a metrics dashboard) |
| Rejected alternatives | **Bugsnag**, **Rollbar** — comparable products in the same category; Sentry selected for its broader adoption and stronger Next.js-specific integration, matching the "ecosystem fit with the already-chosen framework" reasoning applied to State Management (Section 3.5) |
| Migration strategy | SDK-based integration at the application boundary (error boundaries in React, centralized error middleware in Express, `02_enterprise_architecture.md` §16) — a swap would mean changing SDK calls at those boundary points, not a deep architectural change |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | PII scrubbing rules (consistent with the audit-log redaction principle, Section 1.3) must be configured so error reports don't inadvertently capture sensitive user data in stack traces/breadcrumbs |
| Operational risks | **Cost-scaling risk** tied to error-event volume; **Vendor risk** — standard for any SaaS observability tool |

---

## 17. Testing

### 17.1 Vitest — NEWLY SPECIFIED (Unit/Integration)

| Attribute | Detail |
|---|---|
| Purpose | Unit and integration test runner for both `apps/api` (module-level tests colocated per `06_project_structure.md` §4.6) and both frontend apps' component/hook tests |
| Enterprise benefits | Native ESM and TypeScript support without a separate transpilation step — directly fits the TypeScript-everywhere, Turborepo-cached build pipeline already locked (`05_repository_strategy.md` §14) |
| Performance characteristics | Faster cold-start and watch-mode re-run times than Jest in this stack's configuration, meaningfully improving the local dev loop and the CI feedback speed the affected-package Turborepo pipeline is specifically designed to optimize (`05_repository_strategy.md` §14.2) |
| Advantages | Jest-compatible API (low migration/learning cost for anyone with Jest experience), works natively with Vite-family tooling patterns |
| Trade-offs | Younger ecosystem than Jest — some Jest-specific plugins/matchers may need a Vitest-compatible equivalent |
| Rejected alternatives | See the dedicated **Vitest vs. Jest** comparison below |
| Migration strategy | Test files are colocated with the code they test (`06_project_structure.md` §3.2, §4.6) — a runner swap is a configuration-level change, not a test-rewrite, given Vitest's Jest-API compatibility |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | Coverage threshold (flagged as unresolved in `00_architecture_review.md` finding DX3) should be configured once this tool is adopted |
| Operational risks | **Talent risk** — low; Jest-compatible API keeps onboarding friction minimal even for developers new to Vitest specifically |

#### Vitest vs. Jest

| Dimension | Vitest (chosen) | Jest |
|---|---|---|
| Speed | Faster cold start and watch mode in this stack's ESM/TypeScript configuration | Slower in the same configuration, historically requiring more transpilation configuration for ESM/TS |
| Turborepo cache fit | Test results cache cleanly per Turborepo's task-output model (`05_repository_strategy.md` §14.1) | Also cacheable, but Vitest's speed advantage compounds the benefit of Turborepo's affected-only execution |
| Ecosystem maturity | Younger, growing fast, Jest-API-compatible | The long-established default, maximal plugin/matcher ecosystem |
| **Decision basis** | Chosen primarily for the speed and native-ESM/TypeScript fit that directly reinforces the CI-speed goals `05_repository_strategy.md` §5/§14 already built the Turborepo decision around — a slow test runner would partially undercut the caching/affected-execution investment already made. The Jest-compatible API means this choice carries low switching risk if it doesn't hold up in practice | |

### 17.2 Playwright — LOCKED (E2E)

| Attribute | Detail |
|---|---|
| Purpose | Cross-browser end-to-end tests spanning frontend and backend (`04_architecture_decision.md` §10.10 — "e.g., Playwright: full checkout flow, full lead-to-design-project flow") |
| Responsibilities | Root `testing/e2e/` suite (`06_project_structure.md` §9), run against a Docker Compose test environment |
| Enterprise benefits | Multi-browser (Chromium, Firefox, WebKit) coverage from a single test API; auto-waiting reduces the test-flakiness class that plagued earlier e2e tools |
| Advantages | Strong debugging tooling (trace viewer, codegen) reduces the cost of writing and maintaining e2e coverage for the multi-step flows this platform specifically needs tested (checkout, lead-to-design-project conversion, the new Return Flow from v1.1) |
| Trade-offs | E2E tests remain the slowest, most expensive layer of the test pyramid regardless of tool — Playwright reduces but doesn't eliminate that cost, which is why it's reserved for genuinely cross-boundary flows, not general coverage (`06_project_structure.md` §9's `testing/e2e/` scope) |
| Rejected alternatives | See the dedicated **Playwright vs. Cypress** comparison below |
| Migration strategy | Test suite lives in root `testing/e2e/`, isolated from application code — a tool swap doesn't touch `apps/*` |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | E2E suite should track the highest-value flows named in `04_architecture_decision.md` §10.10 first (checkout, lead-to-design-project), expanding coverage deliberately rather than broadly, given the cost noted above |
| Operational risks | **Operational-maturity risk** — running against a real containerized test environment (`06_project_structure.md` §9) requires CI infrastructure capable of standing up that environment reliably |

#### Playwright vs. Cypress

| Dimension | Playwright (chosen) | Cypress |
|---|---|---|
| Browser coverage | True multi-browser (Chromium, Firefox, WebKit) in one API | Chromium-family-first; Firefox/WebKit support has historically been less mature |
| Architecture | Runs outside the browser, controlling it via a protocol — better fit for testing true cross-origin flows (e.g., a Razorpay checkout redirect) | Runs inside the browser — historically had more friction with cross-origin scenarios exactly like a payment-gateway redirect |
| Parallelization | Native, built-in | Requires Cypress's paid Cloud offering for the most seamless parallelization experience |
| **Decision basis** | Chosen specifically because this platform's highest-value e2e flows involve a genuine cross-origin redirect (Razorpay Checkout, `02_enterprise_architecture.md` §11) — exactly the scenario Playwright's out-of-browser architecture handles more cleanly than Cypress's in-browser model, on top of Playwright's stronger multi-browser story | |

---

## 18. CI/CD

### 18.1 GitHub Actions — LOCKED (strongly implied)

`06_project_structure.md` §7.3 already names `.github/workflows/` as the CI/CD location — this confirms GitHub Actions as the concrete tool that folder implies.

| Attribute | Detail |
|---|---|
| Purpose | PR checks (affected-package lint/typecheck/test/build) and scoped deploy triggers (`05_repository_strategy.md` §15, `06_project_structure.md` §7.3) |
| Responsibilities | The full pipeline diagram already designed in `05_repository_strategy.md` §15 — affected-package detection, CODEOWNERS-gated review, per-service image builds, scoped deploys |
| Enterprise benefits | Native GitHub integration (assuming GitHub as the source-control host, consistent with `.github/` already being the named folder) — no separate CI platform to authenticate/configure against the repository host |
| Performance characteristics | Turborepo's remote-cache integration (`05_repository_strategy.md` §14.2) is directly usable from GitHub Actions runners, keeping the CI-speed investment from Section 17.1/`05_repository_strategy.md` §5 intact |
| Scalability | Scales with parallel job/matrix configuration; hosted runners remove infrastructure management for CI compute itself |
| Security | Secrets managed via GitHub's encrypted secrets store for CI-time credentials (distinct from the runtime orchestrator secret store, Section 1.3) — CI-time secrets (e.g., a deploy credential) and runtime secrets (e.g., Razorpay API key) are different secret stores serving different lifecycles |
| Advantages | Matches the already-implied `.github/` folder convention; minimal additional platform to onboard the team onto |
| Trade-offs | Tighter coupling to GitHub specifically — a source-control platform migration would also require a CI platform migration |
| Known limitations | Hosted-runner compute/minute limits on free/lower tiers — a cost/capacity planning item as CI usage grows with Turborepo's own scaling (more packages, more affected-graph runs) |
| Rejected alternatives | See the dedicated **GitHub Actions vs. GitLab CI vs. CircleCI vs. Jenkins** comparison below |
| Migration strategy | Pipeline logic (affected-package detection, scoped builds) is largely Turborepo-driven, not GitHub-Actions-specific — a CI-platform migration would need to reimplement the *workflow orchestration* but not the *build logic* itself |
| Version policy | GitHub Actions runner images/action versions follow Section 1.1's general update discipline |
| Maintenance considerations | Workflow YAML should be reviewed alongside any change to the Turborepo pipeline definition (`05_repository_strategy.md` §14.1) so the two stay in sync |
| Operational risks | **Vendor risk** — tied to GitHub as the source-control host generally, not a CI-specific risk beyond that |

#### GitHub Actions vs. GitLab CI vs. CircleCI vs. Jenkins

| Dimension | GitHub Actions (chosen) | GitLab CI | CircleCI | Jenkins |
|---|---|---|---|---|
| Source-control coupling | Native, zero-friction if the repo is hosted on GitHub | Native if hosted on GitLab — would require the repo to be on GitLab too | Works with GitHub but is a separate platform/vendor relationship | Self-hosted, works with any Git host, but adds infrastructure the team must run |
| Setup/maintenance burden | Low — hosted, managed | Low if already on GitLab | Low, hosted | High — Jenkins itself is infrastructure to provision, patch, and secure |
| Ecosystem/marketplace | Large action marketplace | Comparable built-in feature set | Solid but smaller marketplace than GitHub's | Enormous plugin ecosystem, but self-managed and often a source of technical debt |
| **Decision basis** | Chosen primarily because it's the zero-friction default given the repository is already organized around `.github/workflows/` in `06_project_structure.md` §7.3, and it requires no separate infrastructure to run — consistent with the same "avoid operational burden the team doesn't need to take on" reasoning applied to Deployment (Section 19) and Monitoring (Section 16.1). Jenkins is explicitly rejected on operational-burden grounds alone — self-hosted CI infrastructure is exactly the kind of thing a small team should not be running when a hosted alternative meets the need | | | |

---

## 19. Deployment

### 19.1 Vercel (Frontend Apps) — NEWLY SPECIFIED

| Attribute | Detail |
|---|---|
| Purpose | Hosting for `storefront` and `admin`, per `02_enterprise_architecture.md` §8.1's `storefront`/`admin` container entries |
| Enterprise benefits | Native Turborepo remote-cache integration already flagged as a synergy in `05_repository_strategy.md` §4.2 — deploying on Vercel makes that synergy immediate rather than requiring a separately-hosted remote-cache service |
| Performance characteristics | Edge network delivery for static/ISR content, directly serving the CDN layer already in `02_enterprise_architecture.md` §4's High-Level Architecture diagram |
| Scalability | Serverless scaling model — no capacity planning required for traffic spikes on the frontend tier specifically |
| Security | Environment variables managed through Vercel's project settings, following the same "never in the repo" principle (Section 1.3) |
| Advantages | Zero-configuration ISR/ image-optimization support that a self-hosted Next.js deployment would need to replicate manually |
| Trade-offs | Vendor-specific hosting for the frontend tier — the `api`/`worker` tier deliberately uses a different, non-Vercel target (Section 19.2) precisely because Vercel's serverless model doesn't fit a process that needs persistent DB/Redis connections and long-running BullMQ workers |
| Known limitations | Vercel's serverless function execution-time and cold-start characteristics are not a good fit for the `api`/`worker` containers — this is *why* they're deployed elsewhere, not a limitation being silently accepted |
| Rejected alternatives | **Self-hosted Next.js** (on the same ECS/Fargate target as the backend, Section 19.2) — would give deployment-model uniformity across all four containers, at the cost of losing Vercel's zero-config ISR/edge/image-optimization handling and the Turborepo remote-cache synergy. **Netlify** — comparable capability to Vercel for static/ISR hosting, but weaker first-party Next.js integration and no equivalent Turborepo-specific synergy |
| Migration strategy | `storefront`/`admin` are ordinary Next.js apps with no Vercel-proprietary code — a migration to self-hosted (via the `docker/apps/Dockerfile.storefront`/`Dockerfile.admin` already designed in `06_project_structure.md` §7.1) is a deployment-target change, not an application-code change |
| Version policy | Follows the Next.js version policy (Section 3.1) — Vercel itself is a hosting target, not a versioned dependency |
| Maintenance considerations | Preview-deployment behavior (a Vercel feature) should be documented in `docs/deployment/` (`06_project_structure.md` §8) as part of the PR review workflow |
| Operational risks | **Vendor risk** — real, given Vercel is also the company behind Next.js and Turborepo, meaning three separate technology choices in this stack share one vendor relationship; **Cost-scaling risk** at high traffic/bandwidth |

### 19.2 AWS ECS Fargate (API/Worker) — NEWLY SPECIFIED

| Attribute | Detail |
|---|---|
| Purpose | Hosting for `apps/api` and `apps/worker`, per `02_enterprise_architecture.md` §8.1's `api`/`worker` container entries |
| Enterprise benefits | Serverless container orchestration — no EC2 instances or Kubernetes control plane for the team to patch/manage, while still supporting the persistent connections (MongoDB, Redis) and long-running worker processes Vercel's model doesn't fit |
| Performance characteristics | Task-level autoscaling matches the horizontal-scaling requirement already locked (`02_enterprise_architecture.md` §8.1's "Horizontal, stateless, autoscale on CPU/RPS" for `api`) |
| Scalability | Scales via task count, consistent with the stateless-container design already specified |
| Security | VPC-scoped networking keeps `api`/`worker` and their database/Redis connections off the public internet except through the load balancer, consistent with the admin-app network-hardening requirement (v1.1, `02_enterprise_architecture.md` §8.1) |
| Advantages | Directly implements the Docker-based deployment already designed (`06_project_structure.md` §7.1's Dockerfiles) without requiring the team to run Kubernetes |
| Trade-offs | Less flexible than Kubernetes for complex multi-service orchestration patterns — an accepted trade given this platform's service count (4 deployables) doesn't yet need Kubernetes-level orchestration sophistication |
| Known limitations | AWS-specific — genuine cloud-provider lock-in for the backend tier, mitigated only by the fact that the containers themselves are portable (standard Docker images, per `06_project_structure.md` §7.1) even if the orchestration layer isn't |
| Rejected alternatives | See the dedicated **AWS ECS Fargate vs. Kubernetes (EKS)** comparison below. **Railway/Render** — genuinely simpler for a small team, comparable to Fargate's operational-burden profile, but with less enterprise-scale track record and fewer AWS-ecosystem integration points (VPC peering, IAM-based access control) that matter for a platform storing PII and payment references |
| Migration strategy | Standard Docker images (`06_project_structure.md` §7.1) — a migration to Kubernetes or another container platform reuses the same images, changing only the orchestration/deployment configuration in `docker/` and `.github/workflows/` |
| Version policy | Follows AWS's own ECS/Fargate platform-version updates; application-level dependencies follow Section 1.1 independently |
| Maintenance considerations | Task-definition changes (CPU/memory allocation, environment variable references to the secret store) should be reviewed alongside any `apps/api`/`apps/worker` scaling-relevant change |
| Operational risks | **Vendor risk** — AWS-specific; **Operational-maturity risk** — ECS/Fargate still requires real understanding of task definitions, service auto-scaling policies, and VPC networking, though less than self-managed Kubernetes |

#### AWS ECS Fargate vs. Kubernetes (EKS)

| Dimension | ECS Fargate (chosen) | Kubernetes (EKS) |
|---|---|---|
| Operational burden | No control plane or node management — AWS handles the underlying infrastructure entirely | Even managed Kubernetes (EKS) requires real operational expertise — cluster upgrades, networking (CNI), and workload configuration are the team's responsibility |
| Team-size fit | Matches the small, unified team premise established throughout `04`/`05` | Better suited to a team with dedicated platform/infrastructure engineers — not yet this team's stated shape |
| Flexibility | Sufficient for 4 deployables (`storefront` on Vercel, `admin` on Vercel, `api` and `worker` on Fargate) | Would offer more orchestration sophistication (service mesh, advanced scheduling, multi-cloud portability) that this platform doesn't currently need |
| Future extraction fit | Still works fine for the Hybrid extraction roadmap (`04_architecture_decision.md` §9) — each extracted service becomes its own Fargate service, not a reason to need Kubernetes | Kubernetes becomes more attractive if/when the extraction roadmap produces enough independent services that orchestration complexity itself becomes the bottleneck |
| **Decision basis** | Same reasoning pattern applied consistently throughout this document (Sections 3.5, 5.2, 15.1, 16.1): choose the tool matching the team's current size and operational maturity, not the most powerful option available. **Revisit trigger**, matching the pattern from `02_enterprise_architecture.md` §7.3 and `05_repository_strategy.md` §5: reconsider Kubernetes if the extracted-service count from `04_architecture_decision.md` §9's Hybrid roadmap grows large enough that per-service Fargate configuration becomes more operationally complex than a Kubernetes cluster would be | |

---

## 20. Developer Tooling

### 20.1 TypeScript — LOCKED

| Attribute | Detail |
|---|---|
| Purpose | The single language across `apps/*` and `packages/*` (`02_enterprise_architecture.md` header, `05_repository_strategy.md` §9's naming convention) |
| Responsibilities | Compile-time enforcement of the `@nfi/shared` cross-stack contract — the single biggest structural payoff of the whole Monorepo decision (`05_repository_strategy.md` §10) depends on this choice specifically |
| Enterprise benefits | Catches contract mismatches (a DTO shape drifting from what the frontend expects) at build time, not in production — directly reduces the class of bug `00_architecture_review.md` finding A6 flagged as a risk even with shared types |
| Performance characteristics | Compilation overhead is a build-time cost, not a runtime one — fully absorbed by the Turborepo caching strategy already designed (`05_repository_strategy.md` §14) |
| Scalability | Scales with codebase size better than untyped JavaScript for a codebase this large (15 backend modules, 2 frontend apps, 7 shared packages) — refactoring confidence is a genuine scalability property for a growing team, not just a nicety |
| Security | Type safety is a contributing control against the NoSQL-injection mitigation already discussed (Section 10.1) — strict types make it harder to accidentally pass an unexpected shape into a query |
| Advantages | Single language across the entire stack (Section 4.1's stated rationale); IDE tooling (autocomplete, refactoring, inline documentation) benefits every layer |
| Trade-offs | Compile step and type-checking add developer-facing friction absent in plain JavaScript — accepted given the scale and cross-stack-contract benefits above |
| Known limitations | Type safety is a compile-time guarantee only — runtime validation (Zod, Section 10) remains necessary for any data crossing a trust boundary (API requests, external webhook payloads) |
| Rejected alternatives | **Plain JavaScript** — would eliminate the compile step but also eliminate the `@nfi/shared` type-safety guarantee this whole repository strategy is partly built around; rejected as incompatible with the shared-contract goal already locked, not on some general "TypeScript is always better" basis |
| Migration strategy | N/A — foundational language choice, not something abstracted behind an interface |
| Version policy | Follows Section 1.1; `tsconfig.base.json` (`05_repository_strategy.md` §7.1) is the single point of truth for compiler options, extended by `packages/tsconfig` (Section 5.1 of `06_project_structure.md`) |
| Maintenance considerations | Strict mode enabled repository-wide — loosening it for convenience anywhere would undermine the shared-contract guarantee this decision exists to provide |
| Operational risks | **Talent risk** — low, TypeScript is now the default expectation for serious Node/React work, not a specialized skill |

### 20.2 ESLint — LOCKED (implied)

| Attribute | Detail |
|---|---|
| Purpose | Linting, and specifically the **module-boundary enforcement rule** `04_architecture_decision.md` §8 and `05_repository_strategy.md` §4.4/§6 both rely on as the alternative to adopting Nx |
| Responsibilities | Packaged as `@nfi/eslint-config` (`06_project_structure.md` §5), consumed by every app and package |
| Enterprise benefits | This is the concrete mechanism making `05_repository_strategy.md` §5's decision *not* to adopt Nx actually hold up in practice — without a working module-boundary lint rule, that decision would be unenforced convention, not a real guardrail |
| Advantages | Highly configurable rule set; the specific module-boundary plugin pattern (restricting `domain/` from importing `infrastructure/`, restricting cross-module deep imports) directly encodes the Clean Architecture rule from `02_enterprise_architecture.md` §5 into a CI-enforced check |
| Trade-offs | Configuration and rule-tuning is an ongoing maintenance cost, and false positives/negatives in a custom boundary rule need active tuning as the module structure evolves |
| Rejected alternatives | See the dedicated **ESLint vs. Biome** comparison below |
| Known limitations | A lint rule is enforced at CI/commit time, not at the type-system level — a determined developer could still bypass it locally, though CI (Section 18) blocks the merge |
| Migration strategy | Config lives in one shared package (`@nfi/eslint-config`) — rule changes propagate to every consumer automatically |
| Version policy | Follows Section 1.1 |
| Maintenance considerations | The module-boundary rule specifically should be reviewed every time a new feature module is added (`06_project_structure.md` §4.3's 15-module list) to confirm it still covers the new module correctly |
| Operational risks | **Talent risk** — low; **the real risk this technology exists to reduce** is architectural erosion (`00_architecture_review.md`'s DX2 finding about docs/code drift applies equally to *structure* drift without an enforced check) |

#### ESLint vs. Biome

| Dimension | ESLint (chosen) | Biome |
|---|---|---|
| Ecosystem/plugin maturity | Mature, extensive plugin ecosystem including the module-boundary-style plugins this platform's boundary-enforcement strategy depends on | Much newer, faster (Rust-based), but a smaller plugin ecosystem — the specific module-boundary enforcement pattern this platform needs is less established in Biome's plugin landscape |
| Performance | Slower than Biome on raw linting speed | Meaningfully faster — a real, acknowledged trade-off being given up |
| **Decision basis** | Chosen specifically because the module-boundary enforcement capability (the actual reason ESLint appears in this stack at all, per `05_repository_strategy.md` §4.4) is more mature and battle-tested in ESLint's plugin ecosystem than Biome's today. Revisit if Biome's plugin ecosystem matures to cover this specific need with comparable maturity — the speed advantage would then tip the decision, since the *reason* for choosing ESLint would no longer be exclusive to it | |

### 20.3 Prettier — NEWLY SPECIFIED (condensed)

| Attribute | Detail |
|---|---|
| Purpose | Code formatting, standard pairing alongside ESLint (ESLint for correctness/architecture rules, Prettier for style) |
| Advantages | Removes formatting-style debate from code review entirely — a deterministic formatter, not a matter of individual preference |
| Trade-offs | Opinionated, non-configurable-by-design formatting choices some developers may initially disagree with — the point of the tool is that this stops being negotiable |
| Rejected alternatives | **dprint** — a legitimate, faster alternative; Prettier chosen for its default status and larger ecosystem of editor integrations |
| Version policy / Maintenance | Follows Section 1.1; config lives alongside `@nfi/eslint-config` for consistency |
| Operational risks | Low — a formatting tool carries minimal operational risk |

### 20.4 pnpm — LOCKED (confirmed, cross-referenced)

Fully specified in `05_repository_strategy.md` §4.1 — the strict, non-hoisted `node_modules` isolation that technically enforces the module-boundary architecture (`05_repository_strategy.md` §13). Not re-litigated here; this entry exists only to confirm it's in scope for this TDR's completeness.

### 20.5 Turborepo — LOCKED (confirmed, cross-referenced)

Fully evaluated against pnpm-alone and Nx in `05_repository_strategy.md` §4.2–§5, including the revisit trigger (~20 modules or multi-squad split). Not re-litigated here for the same reason as pnpm above.

---

## 21. Documentation

### 21.1 Markdown + Mermaid.js — LOCKED (by consistent use across `00`–`06`)

| Attribute | Detail |
|---|---|
| Purpose | The format and diagramming technology for every document in this series (`00_architecture_review.md` through `06_project_structure.md`, and this document) |
| Responsibilities | Version-controlled, in-repo documentation living alongside the code it describes (`06_project_structure.md` §8's documentation hierarchy) |
| Enterprise benefits | Documentation changes go through the same PR review process as code — directly enables the "does this change require a docs/ update?" PR-template checkbox already designed in `06_project_structure.md` §7.3 to resolve `00_architecture_review.md` finding DX2 (docs/code drift risk) |
| Performance characteristics | N/A — static content, not a runtime concern |
| Scalability | Scales with the repository itself — no separate documentation platform to keep provisioned/licensed as the team grows |
| Security | No separate access-control system to maintain — documentation access is governed by the same repository permissions as code |
| Advantages | Diagrams (Mermaid) are text-based and diffable in PR review, unlike an embedded image from an external diagramming tool — a reviewer can see exactly what changed in a diagram's structure, not just that "a diagram changed" |
| Trade-offs | Less polished visual presentation than a dedicated documentation platform (Confluence, Notion) — accepted for the version-control and drift-prevention benefits, which this document series has relied on directly (every locked document's Revision History table, and the explicit cross-referencing discipline used throughout `01`–`07`) |
| Known limitations | Large Mermaid diagrams can become visually dense (acknowledged directly in `03_database_design.md` §6's decision to split one mega-ER-diagram into an overview plus per-module diagrams) |
| Rejected alternatives | See the dedicated **Markdown+Mermaid vs. Confluence/Notion vs. Docusaurus** comparison below |
| Migration strategy | Markdown is a portable, tool-agnostic format — exporting to any other documentation platform later is a straightforward conversion, not a rewrite |
| Version policy | N/A — not a versioned dependency; the *documents themselves* carry their own Revision History tables (established starting with the v1.1 remediation pass across `01`–`04`) |
| Maintenance considerations | The cross-referencing discipline (every document citing specific sections of every other locked document) is a maintenance cost that must be actively upheld — a broken cross-reference after a document is updated is a real, if minor, drift risk |
| Operational risks | **Operational-maturity risk** — none beyond ordinary Git repository maintenance; this is the lowest-operational-risk technology choice in the entire stack |

#### Markdown + Mermaid vs. Confluence/Notion vs. Docusaurus

| Dimension | Markdown + Mermaid (chosen) | Confluence/Notion | Docusaurus (standalone site) |
|---|---|---|---|
| Version control | Native — every change is a Git commit, reviewable in a PR | Requires a separate export/sync process to keep in version control, or lives outside Git entirely | Native (it's also Markdown-based), but adds a separate build/deploy pipeline and hosting target |
| Drift risk | Lowest — documentation and code changes can be required in the same PR (the checkbox already designed in `06_project_structure.md` §7.3) | Highest — a wiki page can drift from the code with no enforcement mechanism tying the two together | Low, comparable to plain Markdown, but the extra build/publish step is one more place drift can be introduced (a merged doc change not yet published) |
| Presentation polish | Plain — no rich search, no visual page builder | Strong — rich formatting, search, collaborative editing UX | Strong — generates a polished, searchable static site |
| Team overhead | None — same tools (Git, editor, PR review) the team already uses for code | A second platform to license, administer, and keep permissions in sync with repository access | A build pipeline and hosting target to maintain, on top of the application's own deployment pipeline |
| **Decision basis** | Chosen specifically because this entire document series (`00` through `07`) already demonstrates the drift-prevention benefit in practice — every locked document's Revision History table and cross-reference discipline depends on documentation living in the same repository, reviewed the same way, as the code it describes. A wiki tool would have made the v1.1 remediation pass (traceably updating four documents against thirteen named review findings) meaningfully harder to do with the same auditability. Docusaurus remains a reasonable future option purely for external-facing presentation (e.g., a published developer portal) without changing where the source-of-truth content lives — worth revisiting once `docs/user-guide/` (`06_project_structure.md` §8) has enough content to justify a public-facing site | | |

---

## 22. Consistency Check Against Locked Documents

| Locked technology | Where | How this document complies |
|---|---|---|
| Next.js 15, React, TypeScript, Tailwind, Shadcn UI | `02_enterprise_architecture.md` §2 | Confirmed unchanged (Section 3) |
| Node.js, Express.js, TypeScript | `02_enterprise_architecture.md` §2 | Confirmed unchanged (Section 4) |
| MongoDB, Mongoose | `02_enterprise_architecture.md` §2, `03_database_design.md` | Confirmed unchanged (Section 5) |
| JWT, bcrypt, MFA (v1.1) | `02_enterprise_architecture.md` §9, §14 (v1.1) | Confirmed unchanged (Section 6) |
| Redis | `02_enterprise_architecture.md` §2 | Confirmed unchanged (Section 7) |
| Cloudinary | `02_enterprise_architecture.md` §2, §15 | Confirmed unchanged (Section 8) |
| Razorpay | `02_enterprise_architecture.md` §2, §11 | Confirmed unchanged (Section 9) |
| Zod | `02_enterprise_architecture.md` §16 | Confirmed unchanged (Section 10) |
| MongoDB `$text` index (Search MVP) | `03_database_design.md` §10.4 (v1.1) | Confirmed unchanged (Section 12.1); future service left undecided per the same trigger-based discipline (Section 12.2) |
| WhatsApp Business API | `02_enterprise_architecture.md` §2, §10 | Confirmed unchanged (Section 14.1) |
| Pino | `02_enterprise_architecture.md` §16 | Confirmed unchanged (Section 15.1) |
| Playwright | `04_architecture_decision.md` §10.10 | Confirmed unchanged (Section 17.2) |
| `.github/` (implying GitHub Actions) | `06_project_structure.md` §7.3 | Confirmed and made explicit (Section 18.1) |
| pnpm, Turborepo | `05_repository_strategy.md` §4–§5 | Confirmed, cross-referenced not repeated (Section 20.4–20.5) |
| ESLint module-boundary rule | `04_architecture_decision.md` §8, `05_repository_strategy.md` §4.4 | Confirmed and detailed (Section 20.2) |
| Markdown + Mermaid | Consistent use, `00`–`06` | Confirmed as the documentation technology itself (Section 21.1) |

Every NEWLY SPECIFIED technology (State Management, Email, SMS, APM, Error Tracking, Unit Test Runner, Deployment targets, Prettier) fills a gap `01`–`06` deliberately left generic (an adapter pattern, an "e.g." example, or an unnamed category) rather than reopening a decision those documents already made concretely.

---

## 23. Open Items

- **Search-service selection** (Section 12.2) remains deliberately undecided pending the trigger already defined in `04_architecture_decision.md` §9.1 — not an oversight.
- **Secrets-rotation cadence** (flagged in `00_architecture_review.md` finding S6, still Low-priority and unresolved) should be defined before production launch, now that Section 1.3/Section 6.1 make clear which technologies it applies to (JWT signing secret, Razorpay keys, Cloudinary secret, MongoDB credentials, and now also the Resend/MSG91/Sentry/Grafana API keys named in this document).
- **MFA account-recovery procedure** (Section 6.3) for a staff member who loses their TOTP device is not yet documented anywhere and should be, given MFA is now a Critical-priority-resolved requirement (v1.1).
- **Dependency-update bot choice** (Dependabot vs. Renovate, referenced generically in Section 1.1) is an implementation detail appropriate to settle during initial repository setup, not in this document.
