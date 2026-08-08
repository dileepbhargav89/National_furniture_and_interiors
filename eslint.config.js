// Root-level fallback config — exists only so `lint-staged`'s pre-commit hook (which invokes
// eslint from the repo root, not from within a package) has a config to resolve. The
// authoritative, module-boundary-aware lint is each package's own "lint" script (per-package
// eslint.config.js, run via `pnpm lint` / pr-checks.yml with that package as cwd).
const config = require('@nfi/eslint-config');

module.exports = config;
