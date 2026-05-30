import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

// FSD boundary guardrail. Scope = the layers hardened in DT-24 (app, pages,
// widgets, features). Rules tied to work explicitly deferred in DT-24 are
// turned off here with a tracking note, NOT silently — re-enable per item.
export default defineConfig([
    ...fsd.configs.recommended,

    // Non-FSD utility dirs at src root — not layers.
    {
        ignores: [
            '**/*.test.{ts,tsx}',
            '**/__tests__/**',
            './src/lib/**',
            './src/design-system/**',
            './src/i18n/**',
            './src/styles/**',
            './src/asset/**',
            './src/test/**',
            './src/mock/**',
            './src/main.tsx',
            './src/vite-env.d.ts',
        ],
    },

    // DT-24 residue (deferred): slice→segment subdivision. pages/widgets keep
    // files directly under the slice; moving each into a `ui/` segment is a
    // large follow-up tracked in docs/tech-debt.md.
    {
        rules: {
            'fsd/no-segmentless-slices': 'off',
        },
    },

    // DT-24 residue (deferred): shared-layer hardening. Until shared segments
    // expose public APIs, sidestep diagnostics are noise; enforced layers
    // (pages/widgets/features) already pass. Re-enable with shared barrels.
    {
        rules: {
            'fsd/no-public-api-sidestep': 'off',
        },
    },
    {
        // shared expõe API por caminho de segmento (@ui/Button, @shared/service/http),
        // idiomático nesta layer — public-api por segmento fica deferido (ver DT-24).
        // no-reserved-folder-names já resolvido (shared/component/ui removido).
        files: ['./src/shared/**'],
        rules: {
            'fsd/public-api': 'off',
        },
    },
]);
