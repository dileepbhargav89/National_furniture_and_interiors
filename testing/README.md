# testing/

Cross-cutting test infrastructure spanning multiple apps/packages. Module-level unit tests stay colocated inside each module — they do NOT belong here.
Spec: docs/06_project_structure.md §2.2, docs/12_testing_strategy.md.

- `e2e/` — frontend + backend end-to-end tests (Playwright, docs/07_technology_decision_record.md §17)
- `load/` — load/performance test scenarios (docs/12_testing_strategy.md §4.7)
- `fixtures/` — shared test data factories (`@nfi/test-fixtures`)
- `integration/` — tests exercising a real containerized MongoDB/Redis (docs/12_testing_strategy.md §4.2 — includes the platform's single highest-priority test: concurrent-checkout inventory reservation)
