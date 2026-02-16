import { defineConfig } from 'vite';
import path from 'path';

import { ROUTES } from './src/shared/constant/ROUTES.ts';

import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    base: ROUTES.WEB_URL,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@feature': path.resolve(__dirname, './src/feature'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@app': path.resolve(__dirname, './src/app'),
            '@mock': path.resolve(__dirname, './src/mock'),
        },
    },
});
