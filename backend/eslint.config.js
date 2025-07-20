const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      '*.js',
      '**/*.js',
      '*.d.ts',
      '**/*.d.ts'
    ]
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-interface': 'off', // Temporarily disable this rule
      '@typescript-eslint/no-empty-object-type': 'off', // Temporarily disable this rule
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-console': 'off'
    }
  }
];