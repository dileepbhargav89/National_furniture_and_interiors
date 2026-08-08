// @nfi/eslint-config/next — Next.js addition to the shared base config.
// docs/06_project_structure.md §5, docs/07_technology_decision_record.md §3 (Next.js is the locked frontend framework).
// implementation/00_foundation_setup.md §5.4 step 2: "extends base, adds eslint-config-next".
//
// eslint-config-next (as of 15.5.x) still ships only the legacy eslintrc "extends" format, with
// no flat-config export of its own — FlatCompat is the officially documented bridge (the same
// approach `create-next-app` itself generates for ESLint 9 flat config projects).
const { FlatCompat } = require('@eslint/eslintrc');
const tseslint = require('typescript-eslint');
const base = require('./index.js');

const compat = new FlatCompat({ baseDirectory: __dirname });

module.exports = [
  ...base,
  ...compat.extends('next/core-web-vitals'),
  {
    // eslint-config-next's legacy config sets a Babel-based parser globally and only scopes
    // @typescript-eslint/parser to *.ts(x) via its own internal `overrides` — a nesting FlatCompat
    // does not reliably carry through. Reassert the TS parser last so it wins for TS/TSX files
    // (otherwise type-only usages, e.g. `import type` used solely in a type annotation, are
    // misreported as unused by @typescript-eslint/no-unused-vars under the Babel parser).
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
];
