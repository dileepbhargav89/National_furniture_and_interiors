// @nfi/eslint-config — shared base config (ESLint 9 flat config).
// docs/06_project_structure.md §4.3 (per-module layer template + import rules),
// docs/05_repository_strategy.md §4.4 (module-boundary enforcement is the reason ESLint
// was chosen over Biome — docs/07_technology_decision_record.md §20.2).
const tseslint = require('typescript-eslint');
const importPlugin = require('eslint-plugin-import');
const prettier = require('eslint-config-prettier');

// The 15 locked business modules — docs/06_project_structure.md §4.3.
const MODULES = [
  'auth',
  'users',
  'leads',
  'crm',
  'design-projects',
  'catalog',
  'cart',
  'orders',
  'payments',
  'reviews',
  'media',
  'notifications',
  'cms',
  'admin',
  'analytics',
];

// Relative to apps/api (each workspace package's "lint" script runs with that package as cwd),
// since apps/api is the only package with a src/modules/ tree.
const MODULES_ROOT = './src/modules';

// Builds the four import-boundary zones for one module, per docs/06 §4.3's layer table.
function moduleZones(mod) {
  const otherModuleApplications = MODULES.filter((m) => m !== mod).map((m) => `${m}/application`);

  return [
    // domain/: zero imports from any layer of its own module or any other module.
    {
      target: `${MODULES_ROOT}/${mod}/domain`,
      from: MODULES_ROOT,
      except: [`${mod}/domain`],
      message:
        'domain/ must be framework-free with zero imports from application/, infrastructure/, presentation/, or any other module (docs/06_project_structure.md §4.3).',
    },
    // application/: only its own domain/, or another module's application/ (exported interface).
    {
      target: `${MODULES_ROOT}/${mod}/application`,
      from: `${MODULES_ROOT}/${mod}`,
      except: ['application', 'domain'],
      message:
        "application/ may import its own domain/ only — never its own infrastructure/ or presentation/ (docs/06_project_structure.md §4.3).",
    },
    {
      target: `${MODULES_ROOT}/${mod}/application`,
      from: MODULES_ROOT,
      except: [`${mod}/domain`, `${mod}/application`, ...otherModuleApplications],
      message:
        "application/ may import another module's application/ (exported interface) only — never its domain/, infrastructure/, or presentation/ directly (docs/06_project_structure.md §4.3).",
    },
    // infrastructure/: implements application/'s ports; must not reach into presentation/.
    {
      target: `${MODULES_ROOT}/${mod}/infrastructure`,
      from: `${MODULES_ROOT}/${mod}/presentation`,
      message: 'infrastructure/ must not import presentation/ (docs/06_project_structure.md §4.3).',
    },
    {
      target: `${MODULES_ROOT}/${mod}/infrastructure`,
      from: MODULES_ROOT,
      except: [`${mod}/domain`, `${mod}/application`, `${mod}/infrastructure`],
      message:
        "infrastructure/ must not reach into another module's internals directly (docs/06_project_structure.md §1.6).",
    },
    // presentation/: calls application/ use-cases only — never infrastructure/ or domain/ directly.
    {
      target: `${MODULES_ROOT}/${mod}/presentation`,
      from: `${MODULES_ROOT}/${mod}`,
      except: ['presentation', 'application'],
      message:
        'presentation/ may only call application/ use-cases — never infrastructure/ or domain/ directly (docs/06_project_structure.md §4.3).',
    },
    {
      target: `${MODULES_ROOT}/${mod}/presentation`,
      from: MODULES_ROOT,
      except: [`${mod}/presentation`, `${mod}/application`],
      message:
        "presentation/ must not reach into another module's internals — cross-module access goes through exported interfaces (docs/06_project_structure.md §1.6).",
    },
  ];
}

const moduleBoundaryZones = MODULES.flatMap(moduleZones);

module.exports = [
  {
    // next-env.d.ts is Next.js-generated boilerplate (regenerated on every build) that requires
    // the triple-slash reference @typescript-eslint/triple-slash-reference otherwise forbids.
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    settings: {
      // Without this, eslint-plugin-import's default resolver only tries .js/.json and silently
      // fails to resolve extensionless TypeScript imports — which makes import/no-restricted-paths
      // silently skip every violation below instead of erroring on them.
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
    rules: {
      // docs/18_CLAUDE_CONSTITUTION.md §4.9 — type safety, no `any`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Shared config files are CommonJS by design (ESLint 9 flat config's own convention) —
    // require() here is not the "framework-free domain/" concern Section below guards against.
    files: ['**/*.config.js', '**/eslint.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Module-boundary enforcement — the mechanical closure of docs/06 §4.3's import table,
    // and the concrete reason ESLint (not Biome) was locked in docs/07 §20.2.
    files: ['src/modules/**/*.ts'],
    rules: {
      'import/no-restricted-paths': ['error', { zones: moduleBoundaryZones }],
    },
  },
  {
    // docs/06 §4.3: domain/ and application/ are framework-free — no Express/Mongoose/queue imports.
    files: ['src/modules/*/domain/**/*.ts', 'src/modules/*/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'express', message: 'domain/ and application/ must be framework-free (docs/06_project_structure.md §4.3).' },
            { name: 'mongoose', message: 'domain/ and application/ must not import Mongoose directly — that belongs in infrastructure/ (docs/06_project_structure.md §4.3).' },
            { name: 'ioredis', message: 'domain/ and application/ must not import the cache client directly — that belongs in infrastructure/ (docs/06_project_structure.md §4.3).' },
            { name: 'bullmq', message: 'domain/ and application/ must not import the queue client directly — that belongs in infrastructure/ (docs/06_project_structure.md §4.3).' },
          ],
        },
      ],
    },
  },
  {
    // apps/api/src/core/ is cross-cutting infrastructure only — never business logic (root CLAUDE.md, docs/06 §4.2).
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/modules/*/domain/**', '**/modules/*/application/**'],
              message: 'apps/api/src/core/ is cross-cutting infrastructure only and must not depend on module business logic (root CLAUDE.md "Never" list).',
            },
          ],
        },
      ],
    },
  },
  prettier,
];

module.exports.MODULES = MODULES;
