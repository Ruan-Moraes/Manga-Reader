/**
 * tailwind.config.suggested.js
 *
 * Merge this file's `theme.extend` block with the existing tailwind.config.js
 * in the target project. The block is namespaced via `mr-*` keys to avoid
 * collisions with project tokens.
 *
 * Stack: Tailwind v3 ou v4. Se v4, mover este conteúdo para o bloco
 * @theme { ... } do CSS principal.
 *
 * Premissa: dark-only. Sem block `darkMode` — o produto não tem tema claro.
 *
 * Comentários em pt-BR conforme convenção do projeto.
 */

import type { Config } from 'tailwindcss';

const config: Pick<Config, 'theme'> = {
  theme: {
    extend: {
      // ============================================================
      // CORES — sempre via prefixo `mr-` pra evitar colisão
      // ============================================================
      colors: {
        // Brand
        'mr-primary':   '#161616',
        'mr-secondary': '#252526',
        'mr-tertiary':  '#727273',
        'mr-accent':    '#ddda2a',
        'mr-danger':    '#FF784F',

        // Accent translúcidos (uso: ring, glow, hover de bordas)
        'mr-accent-25': 'rgba(221, 218, 42, 0.25)',
        'mr-accent-50': 'rgba(221, 218, 42, 0.50)',
        'mr-accent-75': 'rgba(221, 218, 42, 0.75)',

        // Escala neutra
        'mr-gray': {
          200: '#cccccc',
          300: '#999999',
          400: '#777777',
          500: '#727273',
          600: '#555555',
          700: '#444444',
          800: '#2d2d2d',
          900: '#1a1a1a',
        },

        // Semânticos — apontam para as vars CSS pra permitir override em runtime
        'mr-bg':            'var(--mr-bg)',
        'mr-surface':       'var(--mr-surface)',
        'mr-surface-muted': 'var(--mr-surface-muted)',
        'mr-border':        'var(--mr-border)',
        'mr-border-subtle': 'var(--mr-border-subtle)',
        'mr-fg':            'var(--mr-fg)',
        'mr-fg-muted':      'var(--mr-fg-muted)',
        'mr-fg-subtle':     'var(--mr-fg-subtle)',
        'mr-fg-disabled':   'var(--mr-fg-disabled)',
        'mr-link':          'var(--mr-link)',

        // Status dot
        'mr-status-operating': '#ddda2a',
        'mr-status-degraded':  '#FF784F',
        'mr-status-down':      '#FF4444',
      },

      // ============================================================
      // TIPOGRAFIA
      // ============================================================
      fontFamily: {
        'mr-sans': ['"Nunito Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        'mr-mono': ['"Fira Code"', '"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // [size, { lineHeight, fontWeight, letterSpacing }]
        // Body é 14, NÃO 16. Letter-spacing default vem do body via globals.
        'mr-h1':    ['32px', { lineHeight: '1.2',  fontWeight: '700' }],
        'mr-h2':    ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        'mr-h3':    ['20px', { lineHeight: '1.3',  fontWeight: '600' }],
        'mr-h4':    ['16px', { lineHeight: '1.4',  fontWeight: '600' }],
        'mr-body':  ['14px', { lineHeight: '1.55', fontWeight: '400' }],
        'mr-small': ['12px', { lineHeight: '1.4',  fontWeight: '400' }],
        'mr-tiny':  ['11px', { lineHeight: '1.3',  fontWeight: '400' }],
        'mr-label': ['11px', { lineHeight: '1',    fontWeight: '700', letterSpacing: '0.08em' }],
      },

      fontWeight: {
        'mr-regular':   '400',
        'mr-semibold':  '600',
        'mr-bold':      '700',
        'mr-extrabold': '800',
      },

      letterSpacing: {
        'mr':       '0.0625rem',  // ≈1px — ASSINATURA do produto. Aplicar no body.
        'mr-label': '0.08em',
        'mr-logo':  '1.5px',
      },

      // ============================================================
      // ESPAÇAMENTO — grid de 8px
      // ============================================================
      spacing: {
        'mr-xs':  '4px',
        'mr-sm':  '8px',
        'mr-md':  '16px',
        'mr-lg':  '24px',
        'mr-xl':  '32px',
        'mr-2xl': '48px',
        'mr-3xl': '64px',
      },

      maxWidth: {
        'mr-container': '1240px',
        'mr-footer':    '1320px',
        'mr-reading':   '720px',
      },

      // ============================================================
      // CANTOS — angulares, propositalmente
      // ============================================================
      borderRadius: {
        'mr-xs':   '2px',   // botões, inputs, badges (default)
        'mr-sm':   '4px',
        'mr-md':   '8px',   // cards, posters, modals
        'mr-lg':   '12px',  // hero, avatar-foto
        'mr-full': '9999px',
      },

      // ============================================================
      // SOMBRAS — offset accent, NÃO depth
      // ============================================================
      boxShadow: {
        'mr-default':  '0.25rem 0.25rem 0 0 rgba(221, 218, 42, 0.25)',
        'mr-elevated': '-0.25rem 0.25rem 0 0 rgba(221, 218, 42, 0.25)',
        'mr-inside':   '0 0 0.075rem 0.25rem rgba(221, 218, 42, 0.25)',
        'mr-black':    '0 0 2rem 0.25rem rgba(22, 22, 22, 0.75)',
      },

      // Text shadows precisam de plugin custom OU usar via CSS direto
      // (Tailwind core não cobre text-shadow). Ver globals.css.suggested
      // pras classes `.mr-text-shadow-*`.

      // ============================================================
      // BREAKPOINTS — mobile-first
      // ============================================================
      screens: {
        'mr-mobile-sm':  '320px',
        'mr-mobile-md':  '375px',
        'mr-mobile-lg':  '425px',
        // sm/md/lg/xl/2xl mantidos dos defaults Tailwind (640/768/1024/1280/1536)
      },

      // ============================================================
      // Z-INDEX
      // ============================================================
      zIndex: {
        'mr-header':    '10',
        'mr-footer':    '10',
        'mr-mobile-tab':'15',
        'mr-dropdown':  '20',
        'mr-drawer':    '40',
        'mr-modal':     '50',
        'mr-toast':     '60',
        'mr-tooltip':   '70',
      },

      // ============================================================
      // ANIMAÇÕES
      // ============================================================
      transitionDuration: {
        'mr-fast':    '150ms',
        'mr-default': '300ms',  // canônica
        'mr-slow':    '500ms',
      },

      transitionTimingFunction: {
        'mr': 'ease',
      },

      keyframes: {
        'mr-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 3px rgba(221, 218, 42, 0.22)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(221, 218, 42, 0.0)' },
        },
        'mr-drawer-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'mr-fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },

      animation: {
        'mr-pulse':     'mr-pulse 2s ease-in-out infinite',
        'mr-drawer-in': 'mr-drawer-in 250ms ease',
        'mr-fade-in':   'mr-fade-in 250ms ease',
      },

      // ============================================================
      // BACKDROP BLUR
      // ============================================================
      backdropBlur: {
        'mr':       '4px',
        'mr-heavy': '10px',
      },

      // ============================================================
      // OPACITY (hover convention)
      // ============================================================
      opacity: {
        'mr-hover':    '0.8',
        'mr-disabled': '0.4',
      },
    },
  },
};

export default config;

/*
 * ============================================================
 * Plugin custom — text-shadow utilities
 * Tailwind v3 não cobre text-shadow. Adicionar plugin abaixo
 * OU usar as classes `.mr-text-shadow-*` definidas em globals.css.
 * ============================================================
 *
 * Em tailwind.config.ts existente:
 *
 *   import plugin from 'tailwindcss/plugin';
 *   plugins: [
 *     plugin(({ addUtilities }) => {
 *       addUtilities({
 *         '.mr-text-shadow-default':   { textShadow: '0.125rem 0.0625rem 0 rgba(22, 22, 22, 0.75)' },
 *         '.mr-text-shadow-highlight': { textShadow: '0.125rem 0.0625rem 0 rgba(221, 218, 42, 0.25)' },
 *       });
 *     }),
 *   ],
 *
 * ============================================================
 * Lint rule sugerida — bloquear emoji em literais
 * ============================================================
 *
 * Em .eslintrc.cjs:
 *
 *   rules: {
 *     'no-restricted-syntax': ['error', {
 *       selector: 'Literal[value=/\\p{Emoji}/u]',
 *       message: 'Use ilustrações chibi de /illustrations/, não emoji.',
 *     }],
 *   }
 */
