## What changed and why

## Which module(s) / package(s) does this touch?

## Checklists

- [ ] Read `docs/18_CLAUDE_CONSTITUTION.md` §10.3 Pull Request Checklist before opening
- [ ] Does this change require a `docs/` update? (docs/11_engineering_workflow.md §6.1, resolves finding DX2)
- [ ] Does this change touch `apps/api/src/core/`, a shared `packages/*`, or implement/amend an ADR? → requires 2 approvals (docs/11 §4.2)
- [ ] Does this change touch auth/PII/payment/external-integration code? → requires security review (docs/09 §12.3)
- [ ] Tests added/updated per module test scope (docs/12_testing_strategy.md §3)
- [ ] No hardcoded secret, no bypassed validation, no bypassed RBAC (docs/18 §8)

## Related issue / ADR
