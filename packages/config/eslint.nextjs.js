import baseConfig from './eslint.base.js';

/**
 * Next.js ESLint Flat Configuration extending base.
 * @type {import('eslint').Linter.Config[]}
 */
const nextjsConfig = [
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/alt-text': 'warn',
      'no-html-link-for-pages': 'off',
    },
  },
];

export default nextjsConfig;
