/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: [
    'border-quaternary-default !important',
    'border-quinary-default !important',
    'text-quinary-default !important',
  ],
  theme: {
    extend: {
      screens: {
        'mobile-sm': '20rem !important',
        'mobile-md': '23.4375rem !important',
        'mobile-lg': '26.5625rem !important',
      },
      colors: {
        primary: {
          default: '#161616 !important',
          opacity: {
            80: '#161616cc !important',
            75: '#161616bf !important',
          },
        },
        secondary: '#252526 !important',
        tertiary: '#727273 !important',
        quaternary: {
          default: '#ddda2a !important',
          opacity: {
            25: '#ddda2a40 !important',
            50: '#ddda2a80 !important',
          },
        },
        quinary: {
          default: '#FF784F !important',
        },
      },
      boxShadow: {
        black: '0 0 2rem 0.25rem #161616bf !important',
        default: '0.25rem 0.25rem 0 0 #ddda2a40 !important',
        inside: '0 0 0.075rem 0.25rem #ddda2a40 !important',
        elevated: '-0.25rem 0.25rem 0 0 #ddda2a40 !important',
      },
      textShadow: {
        default: '0.125rem 0.0625rem 0 #161616bf !important',
        highlight: '0.125rem 0.0625rem 0 #ddda2a40 !important',
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
          'text-shadow': (value) => ({
            textShadow: value + ' !important',
          }),
        },
        { values: theme('textShadow') }
      );
    }),
  ],
};
