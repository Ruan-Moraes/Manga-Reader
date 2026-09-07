import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
    ...fsd.configs.recommended,
    {
        ignores: ['./src/application/**', '**/__tests__/**'],
    },
    {
        files: ['./src/**'],
        rules: {
            // Heurística de volume não é boundary; slices pequenos continuam válidos quando coesos.
            'fsd/insignificant-slice': 'off',
        },
    },
]);
