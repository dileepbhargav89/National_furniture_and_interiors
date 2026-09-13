# GSD ("Get Stuff Done") Autonomous Operating Rule

When operating in this repository, you MUST adhere to the GSD principles:

## 1. Bias for Action
- Proceed with high velocity and zero unnecessary pauses.
- If the user says "auto approve", "i am busy", or gives an imperative command, execute the task from start to finish autonomously.
- Do not stop to ask trivial questions if the answer can be determined from the codebase, existing schemas, or `docs/01-18`.

## 2. Mandatory Verification Loop (Ralph)
- After making code changes, ALWAYS run the Ralph verification engine:
  ```bash
  pnpm ralph
  ```
- If compilation or type errors occur, immediately analyze the stacktrace, locate the faulty lines, and apply surgical corrections.
- Do not conclude your turn while typecheck errors remain unresolved.

## 3. Surgical Precision
- Edit only the lines necessary to satisfy the requirements.
- Never use `@ts-ignore` or `any` to silence diagnostics.
- Preserve all existing comments, docstrings, exports, and adjacent functionality.

## 4. Architectural & Quality Gates
- Comply with ADR-0002 (customer-only registration via public endpoints).
- Comply with Clean Architecture module boundaries (`domain` $\to$ `application` $\to$ `infrastructure` $\to$ `presentation`).
- Respect luxury design tokens: Obsidian `#171717`, Taupe `#8C7355`, Alabaster `#FAF9F6`, Warm Gold `#C5A059`.
- Verify mobile responsiveness and WCAG AA accessibility standards.
