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
                    default: 'var(--mr-primary) !important',
                    opacity: {
                        80: 'var(--mr-primary-80) !important',
                        75: 'var(--mr-primary-75) !important',
                    },
                },
                secondary: 'var(--mr-secondary) !important',
                tertiary: 'var(--mr-tertiary) !important',
                quaternary: {
                    default: 'var(--mr-accent) !important',
                    opacity: {
                        25: 'var(--mr-accent-25) !important',
                        50: 'var(--mr-accent-50) !important',
                        75: 'var(--mr-accent-75) !important',
                    },
                },
                quinary: {
                    default: 'var(--mr-danger) !important',
                },
            },
            boxShadow: {
                black: 'var(--mr-shadow-black) !important',
                default: 'var(--mr-shadow-default) !important',
                inside: 'var(--mr-shadow-inside) !important',
                elevated: 'var(--mr-shadow-elevated) !important',
            },
            textShadow: {
                default: 'var(--mr-text-shadow-default) !important',
                highlight: 'var(--mr-text-shadow-highlight) !important',
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
