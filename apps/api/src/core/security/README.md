# `core/security`

Cross-cutting security infrastructure — docs/06_project_structure.md §4.2. Generic middleware factories only; no module-specific authorization logic lives here (that belongs in each module's `presentation/` layer, e.g. `authMiddleware`/`rbacMiddleware` will live in the `auth` module once built).

## CSRF posture — no middleware, by design

docs/08_api_architecture.md §4.9: the refresh-token cookie's `SameSite=Strict` attribute (set when the `auth` module actually issues that cookie) is the primary CSRF defense for the one endpoint that relies on a cookie at all (`POST /auth/refresh`). Every other endpoint authenticates via the `Authorization` header, which browsers do not attach automatically cross-origin, so it isn't CSRF-exposed the way cookie-based auth would be. No separate CSRF token is issued. This file records the decision; there is no CSRF code to write in `core/` because the control is a cookie attribute set at the point the cookie is created (in `auth`'s own `infrastructure/`/`presentation/`), not a generic middleware.

**docs/09_security_architecture.md §11 rule 9** applies going forward: no new cookie-based authentication may be added without re-reviewing this posture.
