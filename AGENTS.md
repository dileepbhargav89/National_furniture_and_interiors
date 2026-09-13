# AI Agent Operating System — National Furniture & Interiors

Welcome to the **National Furniture & Interiors** codebase. This repository uses an autonomous, high-velocity, self-healing agent ecosystem consisting of **GSD**, **Ralph**, **The 4-Agent Review Protocol**, and **CodeRabbit**.

---

## 1. Quick Navigation & Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Autonomous Verification (Ralph)** | `pnpm ralph` | Runs parallel typecheck across all monorepo workspaces |
| **Full Verification** | `pnpm ralph --all` | Runs typecheck, ESLint, and test suites |
| **Auto-Fix** | `pnpm ralph --fix` | Runs Prettier format and ESLint auto-fix |
| **Targeted Package Check** | `pnpm ralph --package=@nfi/api` | Check single workspace (`apps/api`, `storefront`, `admin`, etc.) |
| **Development Servers** | `pnpm dev` | Starts Storefront (:3000), Admin (:3001), API (:4000) |
| **Unit & Integration Tests** | `pnpm test` | Runs Turbo test runner across packages |
| **Linting** | `pnpm lint` | Runs ESLint across all packages |

---

## 2. The GSD ("Get Stuff Done") Protocol

All agents working in this repository operate under the **GSD Protocol**:
1. **Bias for Action**: Never stall on trivial decisions. If the direction is defined by architecture docs or standards, execute immediately.
2. **Autonomous Verification**: Every change must be verified via `pnpm ralph` before declaring completion.
3. **Surgical Precision**: Target only relevant files. Never rewrite intact modules or wipe out existing documentation.
4. **Self-Healing Resilience**: When errors or compiler warnings occur, immediately parse diagnostics, find the exact file and line, and fix it.
5. **No Shortcut Types**: Never use `any`, `@ts-ignore`, or `@ts-expect-error` to bypass TypeScript rules.

---

## 3. The Ralph Autonomous Iteration Loop

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE RALPH ITERATION LOOP                        │
│                                                                        │
│   [Execute Check] ──► [Catch Errors] ──► [Parse Diagnostics]          │
│          ▲                                       │                     │
│          │                                       ▼                     │
│   [Re-Verify]     ◄── [Apply Surgical Fix] ◄── [Locate Source Code]   │
└────────────────────────────────────────────────────────────────────────┘
```

When any code changes are made:
1. Run `pnpm ralph`.
2. If errors are reported, the Ralph runner outputs the file path, line, column, error code, and diagnostic message.
3. Edit the offending code surgically.
4. Rerun `pnpm ralph` until zero errors are reported.

---

## 4. CodeRabbit AI Review Standards

Every pull request is reviewed by CodeRabbit (`.coderabbit.yaml`). CodeRabbit enforces:
- **Strict TypeScript**: `exactOptionalPropertyTypes` compliance, zero `any`.
- **Clean Architecture Boundaries**:
  - `domain/`: Pure business entities and contracts.
  - `application/`: Application use cases and services.
  - `infrastructure/`: Mongoose schemas, Redis caching, database repositories.
  - `presentation/`: Fastify/Express routes, controllers, Zod validation schemas.
- **Security & ADR-0002 Compliance**: Public registration (`POST /api/v1/auth/register`) strictly permits only `role: 'CUSTOMER'`. Any admin or staff roles require authenticated internal provisioning.
- **Luxury UI/UX Aesthetics**:
  - Primary Obsidian: `#171717`
  - Accent Taupe: `#8C7355`
  - Luxury Gold: `#C5A059` / `#D4AF37`
  - Alabaster Background: `#FAF9F6`
  - Accessibility: WCAG 2.1 AA compliance (contrast ratio $\ge 4.5:1$), responsive touch targets $\ge 44\text{px}$.

---

## 5. The 4-Agent Review Evaluation

Before finalizing major features or pull requests, verify across the 4 key evaluation pillars:
1. **Logic & Architecture Agent**: Contract integrity, zero type errors, clean boundaries.
2. **Performance & CWV Agent**: LCP $\le 2.5\text{s}$, CLS $\le 0.1$, INP $\le 200\text{ms}$, optimized Next.js `<Image>`.
3. **UI/UX & Accessibility Agent**: Luxury aesthetic, typography hierarchy, screen reader support, keyboard navigation.
4. **Business & Conversion Agent**: Clear pricing in ₹ (INR), friction-free cart/checkout, consultation lead capture, trust markers.
