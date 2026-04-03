/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

import * as path from 'path';

import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@feature': path.resolve(__dirname, './src/feature'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@app': path.resolve(__dirname, './src/app'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/test/**',
                'src/**/*.d.ts',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
        },
    },
});
