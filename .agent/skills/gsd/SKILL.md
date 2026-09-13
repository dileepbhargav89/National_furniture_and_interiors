---
name: gsd
description: Autonomous high-velocity execution framework. Biased for immediate action, proactive self-healing, zero unnecessary questions, deep architecture adherence, and end-to-end verified delivery.
---

# GSD — "Get Stuff Done" Autonomous Execution Framework

GSD is an operating framework that empowers AI agents to execute complex software engineering tasks with high velocity, zero hesitation, deep architectural discipline, and end-to-end verification.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THE GSD 5-PHASE ENGINE                        │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Phase 1: Rapid Reconnaissance │
                   │   Grep / View / Trace Truth   │
                   └───────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Phase 2: Action Architecture  │
                   │   Isolate blast radius & plan │
                   └───────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Phase 3: Surgical Execution   │
                   │   Precise edits, no fluff     │
                   └───────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Phase 4: Self-Healing (Ralph) │
                   │   Run pnpm ralph, fix errors  │
                   └───────────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Phase 5: Verified Signoff     │
                   │   Live verify, concise report │
                   └───────────────────────────────┘
```

---

## The 5 Core Pillars of GSD

### 1. Bias for Action (Zero Stalling)
- Never ask the user trivial questions or pause for obvious choices.
- If a decision is already governed by the architecture documents (`docs/01-18`), implement it immediately.
- If requirements are underspecified, choose the most professional, robust, and industry-standard pattern, document the rationale, and proceed.

### 2. Autonomous Verification
- Never claim a task is "done" without proving it with real execution.
- Always run the Ralph self-healing loop: `pnpm ralph`.
- If UI components are modified, verify they render cleanly without layout shifts or console errors.

### 3. Surgical Precision
- Make targeted edits using precise replacements rather than wholesale overwrites.
- Preserve existing comments, docstrings, formatting, and adjacent logic.
- Avoid introducing foreign dependencies or modifying locked architectural boundaries.

### 4. Self-Healing Resilience
- When a command fails or a compiler diagnostic triggers, do not panic or ask the user what to do.
- Read the stacktrace, locate the faulty file and line, analyze the type mismatch or assertion failure, apply the fix, and re-run.

### 5. Enterprise Standards
- **Architecture**: Enforce Clean Architecture (`domain` $\to$ `application` $\to$ `infrastructure` $\to$ `presentation`).
- **Typing**: Strict TypeScript, zero `any`, `exactOptionalPropertyTypes` compliance.
- **Security**: Validate inputs with Zod (`.strict()`), enforce ADR-0002 customer-only public registration, sanitize outputs.
- **Aesthetics**: Adhere to luxury brand design tokens (`#171717` Obsidian, `#8C7355` Taupe, `#FAF9F6` Alabaster, `#C5A059` Gold), WCAG AA accessibility, and mobile responsiveness.

---

## When to Activate GSD

Activate GSD whenever:
- The user requests multi-step features, refactoring, bug fixes, or tooling setup.
- The user expresses urgency ("be quick", "auto approve", "i am busy", "just do it").
- You are running automated scripts, fixing compilation regressions, or delivering complete PR-ready increments.
