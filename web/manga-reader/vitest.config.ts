/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

import * as path from 'path';

import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@features': path.resolve(__dirname, './src/features'),
            '@entities': path.resolve(__dirname, './src/entities'),
            '@mock': path.resolve(__dirname, './src/mock'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@app': path.resolve(__dirname, './src/app'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@widgets': path.resolve(__dirname, './src/widgets'),
            '@ui': path.resolve(__dirname, './src/shared/ui'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        pool: 'forks',
        maxWorkers: 4,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
        },
    },
});
