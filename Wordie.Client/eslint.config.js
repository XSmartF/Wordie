import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*.{ts,tsx}'],
      'boundaries/elements': [
        { type: 'core', pattern: 'core/**' },
        { type: 'shared', pattern: 'shared/**' },
        { type: 'features', pattern: 'features/**' },
        { type: 'pages', pattern: 'pages/**' },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          message: 'Layer violation: "{{from}}" cannot depend on "{{to}}".',
          rules: [
            {
              from: 'core',
              allow: ['core'],
            },
            {
              from: 'shared',
              allow: ['shared', 'core'],
            },
            {
              from: 'features',
              allow: ['features', 'shared', 'core'],
            },
            {
              from: 'pages',
              allow: ['pages', 'features', 'shared', 'core'],
            },
          ],
        },
      ],
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useFormField'] },
      ],
    },
  },
])
