module.exports = {
  rules: {
    curly: ['error', 'all'],
    'no-debugger': 'error',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-explicit-any': 'warn',
    'consistent-type-imports': ['error', { prefer: 'type-imports' }],
  },
  ignorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/playwright-report/**',
    '**/test-results/**',
  ],
};
