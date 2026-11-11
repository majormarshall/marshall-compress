import baseConfig from './eslint.base.js';

/**
 * NestJS ESLint Flat Configuration extending base.
 * @type {import('eslint').Linter.Config[]}
 */
const nestjsConfig = [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-useless-constructor': 'off',
      'no-empty-function': ['error', { allow: ['constructors'] }],
      'class-methods-use-this': 'off',
    },
  },
];

export default nestjsConfig;
