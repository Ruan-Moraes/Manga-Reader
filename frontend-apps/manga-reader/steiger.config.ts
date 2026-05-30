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

    // Advisórios não aplicáveis a este app:
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

    // entities cross-referenciam entities por relação de domínio (Title↔Chapter,
    // Comment→User, Manga→Rating, etc.). FSD sanciona via cross-import API (@x);
    // migração p/ @x é trabalho futuro (DT-24). Guard cross-layer segue ON nas
    // demais layers. entity→feature (upward) é estruturalmente improvável + pega em review.
    {
        files: ['./src/entities/**'],
        rules: {
            'fsd/forbidden-imports': 'off',
        },
    },

]);
