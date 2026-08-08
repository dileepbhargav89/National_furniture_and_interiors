# api

The single Modular Monolith deployable — one workspace package (`@nfi/api`), not one per module (docs/05_repository_strategy.md §8.2). Hosts all 15 feature modules under `src/modules/`, each following the identical 4-layer template.

The only process with database credentials (docs/06_project_structure.md §1.7) — `storefront` and `admin` never talk to MongoDB directly.

Structure: docs/06_project_structure.md §4. Cross-cutting infrastructure lives in `src/core/`, never inside a module.
