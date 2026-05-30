import { defineConfig, loadEnv } from 'vite';
import path from 'path';

import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        base: env.VITE_BASE_URL ?? '/Manga-Reader',
        publicDir: path.resolve(__dirname, '../packages/assets/icons'),
        plugins: [react(), tailwindcss()],
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
        server: {
            proxy: {
                '/api': {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                },
            },
        },
    };
});
