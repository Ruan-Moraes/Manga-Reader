import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

// FSD boundary guardrail. Scope = the layers hardened in DT-24 (app, pages,
// widgets, features). Rules turned off below fall in two buckets, each noted:
// (a) PERMANENT/won't-fix — intentional project idiom or false-positives;
// (b) (none currently deferred — DT-25 closed the remaining items).
export default defineConfig([
    ...fsd.configs.recommended,

    // Non-FSD utility dirs at src root — not layers.
    {
        ignores: [
            '**/*.test.{ts,tsx}',
            '**/__tests__/**',
            './src/i18n/**',
            './src/styles/**',
            './src/test/**',
            './src/mock/**',
            './src/main.tsx',
            './src/vite-env.d.ts',
        ],
    },

    // PERMANENT (won't-fix) — shared-layer public API by segment path.
    // The project deliberately imports shared by segment path (@ui/Button,
    // @shared/service/http, @shared/constant/QUERY_KEYS). Enforcing barrels here
    // measured 232 sidestep diagnostics across the app and would reverse the
    // established idiom for ~zero benefit (FSD treats `shared` as a layer without
    // slices). Decided to keep OFF permanently — see DT-25.7.
    {
        rules: {
            'fsd/no-public-api-sidestep': 'off',
        },
    },
    {
        files: ['./src/shared/**'],
        rules: {
            'fsd/public-api': 'off',
        },
    },

    // Desvios same-layer conhecidos e aceitos:
    // - layouts/ (shells de rota) compõem header/footer/mobile-tab-bar (widget→widget).
    // - design/ é showcase e compõe os forms de login/sign-up/forgot-password (page→page).
    {
        files: [
            './src/widgets/layouts/ui/RootLayout.tsx',
            './src/widgets/layouts/ui/PageShell.tsx',
            './src/pages/design/ui/DesignAuth.tsx',
        ],
        rules: {
            'fsd/forbidden-imports': 'off',
        },
    },

    // PERMANENT (won't-fix) — advisories that are false-positives for this app:
    // - excessive-slicing: 28 páginas é o tamanho real do app (acima do limite 20).
    // - insignificant-slice: login/sign-up/forgot são rotas reais (router não conta como ref).
    // - inconsistent-naming: falso-positivo em `news` (substantivo de domínio, não plural).
    {
        rules: {
            'fsd/excessive-slicing': 'off',
            'fsd/insignificant-slice': 'off',
            'fsd/inconsistent-naming': 'off',
        },
    },

    // entity↔entity cross-refs agora via FSD cross-import API (@x):
    // entities/<target>/@x/<consumer>.ts. forbidden-imports volta a ON full.

]);
