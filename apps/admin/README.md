# admin

Internal staff-facing Next.js 15 App Router application — lead triage, design-project management, catalog/order administration, reporting, user & role management.

Structure: docs/06_project_structure.md §3 (identical template to `storefront`). Route groups: `(leads)`, `(design-projects)`, `(catalog)`, `(orders)`, `(reports)`, `(users-roles)` — docs/02_enterprise_architecture.md §6.2.

Never imports `apps/storefront` or `apps/api` as a package — talks to the API over HTTP only, via `@nfi/api-client`.
