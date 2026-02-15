import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    {
        // 1. Configurações para ignorar arquivos (aplica-se a todos)
        ignores: ['dist', 'node_modules'],
    },

    // 2. Regras ESLint recomendadas gerais (aplica-se a todos os arquivos lintados por padrão)
    js.configs.recommended,

    // 3. Configuração específica para arquivos TypeScript (.ts, .tsx)
    // Este bloco define o parser TypeScript e as opções de projeto para análise de tipos.
    {
        files: ['**/*.{ts,tsx}'], // <-- IMPORTANTE: Aplica SOMENTE a arquivos TypeScript
        extends: [
            // Regras recomendadas do TypeScript ESLint (elas já configuram o parser para arquivos TS/TSX)
            ...tseslint.configs.recommended,
            // Se você estiver usando regras mais rigorosas baseadas em tipos, adicione-as aqui:
            // ...tseslint.configs.strictTypeChecked,
            // ...tseslint.configs.stylisticTypeChecked,
        ],
        languageOptions: {
            parser: tseslint.parser, // Garante que o parser do TypeScript seja usado para estes arquivos
            parserOptions: {
                // === CORREÇÃO AQUI: APONTAR PARA tsconfig.app.json ===
                project: ['./tsconfig.app.json', './tsconfig.node.json'], // <-- Este é o arquivo que inclui seus arquivos de app
                // Se você tiver regras de lint que dependem de tipos para arquivos Node (como `vite.config.ts`),
                // você pode precisar de outro bloco similar apontando para 'tsconfig.node.json' para esses arquivos,
                // ou criar um tsconfig.eslint.json que inclua ambos.
            },
        },
        // Adicione regras específicas do TypeScript aqui se quiser, ex:
        // rules: {
        //   "@typescript-eslint/no-floating-promises": "error",
        // },
    },

    // 4. Configuração para regras de React e outras regras gerais (aplica-se a todos os arquivos de código, TS/TSX/JS/JSX)
    // Este bloco não terá parserOptions.project, evitando o erro para arquivos JS e o próprio eslint.config.js
    {
        files: ['**/*.{ts,tsx,js,jsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
            },
            // Não defina 'parser' ou 'parserOptions.project' aqui!
            // Para arquivos JS/JSX, o ESLint usará o parser padrão.
            // Para arquivos TS/TSX, o bloco anterior já configurou o parser TS.
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'no-unused-vars': 'warn',
            'no-console': 'warn',
        },
    },

    // 5. Integração com Prettier (SEMPRE A ÚLTIMA CONFIGURAÇÃO!)
    // Garante que as regras de formatação do Prettier tenham a precedência final.
    eslintPluginPrettierRecommended,
);
