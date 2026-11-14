import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { readFileSync } from 'node:fs';

import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const brand = JSON.parse(readFileSync(path.resolve(__dirname, '../../scripts/config/brand.json'), 'utf8'));

    return {
        // Firebase Hosting serves the app from the domain root.
        base: env.VITE_BASE_URL ?? '/',
        publicDir: path.resolve(__dirname, '../packages/assets/icons'),
        plugins: [react(), tailwindcss(), {
            name: 'brand-static-metadata',
            transformIndexHtml(html) {
                return html.replaceAll('%BRAND_NAME%', brand.name).replaceAll('%BRAND_DESCRIPTION%', brand.description);
            },
        }],
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
                '@toonlira/brand': path.resolve(__dirname, '../packages/brand/src/index.ts'),
            },
        },
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                    headers: {
                        Origin: 'http://localhost:5173',
                    },
                },
            },
        },
    };
});
