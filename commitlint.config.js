// Conventional Commits enforcement — docs/11_engineering_workflow.md §3.3.
// Scope-enum matches docs/06_project_structure.md's 15-module vocabulary exactly, plus the
// cross-cutting scopes every module list would otherwise be missing (core/, dependencies, CI, docs, release).
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
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
        'core',
        'deps',
        'ci',
        'docs',
        'release',
      ],
    ],
  },
};
