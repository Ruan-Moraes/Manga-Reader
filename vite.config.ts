import { defineConfig } from 'vite';

import { ROUTES } from './src/constants/API_CONSTANTS';

import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    base: ROUTES.WEB_URL,
    plugins: [react(), tailwindcss()],
});
