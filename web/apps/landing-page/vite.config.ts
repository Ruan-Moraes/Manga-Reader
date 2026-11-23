import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const brand = JSON.parse(readFileSync(path.resolve(__dirname, '../../../scripts/brand/config/brand.json'), 'utf8'));

export default defineConfig({
    plugins: [react(), tailwindcss(), {
        name: 'brand-static-metadata',
        transformIndexHtml(html) {
            return html
                .replaceAll('%BRAND_NAME%', brand.name)
                .replaceAll('%BRAND_DESCRIPTION%', brand.description)
                .replaceAll('%BRAND_TAGLINE%', brand.tagline);
        },
    }],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'vendor-react';
                        }
                        if (id.includes('@tanstack/react-query')) {
                            return 'vendor-query';
                        }
                        if (id.includes('i18next')) {
                            return 'vendor-i18n';
                        }
                        return 'vendor';
                    }
                    if (id.includes('locales/')) {
                        if (id.includes('en-US')) return 'locale-en';
                        if (id.includes('es-ES')) return 'locale-es';
                        if (id.includes('pt-BR')) return 'locale-pt';
                    }
                },
            },
        },
    },
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
});
