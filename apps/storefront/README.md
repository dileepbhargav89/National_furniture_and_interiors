# storefront

Customer-facing Next.js 15 App Router application — furniture catalog, cart, checkout, interior design consultation booking, account.

Structure: docs/06_project_structure.md §3. Route groups: `(marketing)`, `(interior-design)`, `(catalog)`, `(cart-checkout)`, `(account)` — docs/02_enterprise_architecture.md §6.2.

Never imports `apps/admin` or `apps/api` as a package — talks to the API over HTTP only, via `@nfi/api-client` (docs/06 §11's dependency diagram).
