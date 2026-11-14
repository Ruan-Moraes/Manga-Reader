/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    safelist: ['border-quaternary-default !important', 'border-quinary-default !important', 'text-quinary-default !important'],
    theme: {
        extend: {
            screens: {
                'mobile-sm': '20rem', // 320px
                'mobile-md': '23.4375rem', // 375px
                'mobile-lg': '26.5625rem', // 425px
            },
            colors: {
                primary: {
                    default: 'var(--ui-primary) !important',
                    opacity: {
                        80: 'var(--ui-primary-80) !important',
                        75: 'var(--ui-primary-75) !important',
                    },
                },
                secondary: 'var(--ui-secondary) !important',
                tertiary: 'var(--ui-tertiary) !important',
                quaternary: {
                    default: 'var(--ui-accent) !important',
                    opacity: {
                        25: 'var(--ui-accent-25) !important',
                        50: 'var(--ui-accent-50) !important',
                        75: 'var(--ui-accent-75) !important',
                    },
                },
                quinary: {
                    default: 'var(--ui-danger) !important',
                },
            },
            boxShadow: {
                black: 'var(--ui-shadow-black) !important',
                default: 'var(--ui-shadow-default) !important',
                inside: 'var(--ui-shadow-inside) !important',
                elevated: 'var(--ui-shadow-elevated) !important',
            },
            textShadow: {
                default: 'var(--ui-text-shadow-default) !important',
                highlight: 'var(--ui-text-shadow-highlight) !important',
            },
            transitionProperty: {
                'text-shadow': 'text-shadow !important',
            },
            animation: {
                marquee: 'marquee 20s linear infinite !important',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(125%) !important' },
                    '100%': { transform: 'translateX(-150%) !important' },
                },
            },
        },
    },
    plugins: [
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    'text-shadow': value => ({
                        textShadow: value + ' !important',
                    }),
                },
                { values: theme('textShadow') },
            );
        }),
    ],
};
