const tseslint = require('@typescript-eslint/eslint-plugin')
const tsParser = require('@typescript-eslint/parser')
const next = require('@next/eslint-plugin-next')
const jsxA11y = require('eslint-plugin-jsx-a11y')

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      // Tooling/config files (CJS `require`, non-app concerns)
      'eslint.config.js',
      'next.config.js',
      'postcss.config.js',
      'tailwind.config.js',
    ],
  },

  // TypeScript baseline rules (flat-config native).
  ...tseslint.configs['flat/recommended'],

  // App rules: Next + a11y + project conventions.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': next,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...next.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,

      // Project rules (ported from prior `.eslintrc.json`)
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Tests and setup files need some flexibility.
  {
    files: ['**/__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]

