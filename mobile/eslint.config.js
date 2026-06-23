const js = require('@eslint/js');
const prettier = require('eslint-config-prettier');
const reactHooks = require('eslint-plugin-react-hooks');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    {
        ignores: ['.expo/**', 'node_modules/**', 'docs/auth-design-reference/**'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            'react-hooks': reactHooks,
            'simple-import-sort': simpleImportSort,
        },
        languageOptions: {
            globals: {
                __DEV__: 'readonly',
                require: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            'no-undef': 'off',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: [
                                '@/src/components',
                                '@/src/components/*',
                                '@/src/constants',
                                '@/src/constants/*',
                                '@/src/services',
                                '@/src/services/*',
                                '@/src/stores',
                                '@/src/stores/*',
                                '@/src/types',
                                '@/src/types/*',
                            ],
                            message: 'Use the FSD public API under @/src/shared, @/src/features, or @/src/pages.',
                        },
                        {
                            group: ['@/src/features/*/api/*', '@/src/features/*/config/*', '@/src/features/*/model/*', '@/src/features/*/ui/*'],
                            message: 'Import feature slices through their public API.',
                        },
                        {
                            group: ['@/src/shared/*/*'],
                            message: 'Import shared segments through their public API.',
                        },
                    ],
                },
            ],
            'simple-import-sort/exports': 'error',
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [['^react$', '^react-native$', '^expo', '^@expo', '^@?\\w'], ['^@/'], ['^\\.']],
                },
            ],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',
        },
    },
    prettier,
);
