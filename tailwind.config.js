/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'border-quaternary-default',
    'border-quinary-default',
    'text-quinary-default',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          default: '#161616',
          opacity: {
            75: '#161616bf',
          },
        },
        secondary: '#252526',
        tertiary: '#727273',
        quaternary: {
          default: '#ddda2a',
          opacity: {
            25: '#ddda2a40',
            50: '#ddda2a80',
          },
        },
        quinary: {
          default: '#FF784F',
        },
      },
      boxShadow: {
        default: '0.25rem 0.25rem 0 0 #ddda2a40',
        inside: '0 0 0.075rem 0.25rem #ddda2a40',
        elevated: '-0.25rem 0.25rem 0 0 #ddda2a40',
      },
      textShadow: {
        default: '0.125rem 0.0625rem 0 #161616bf',
        highlight: '0.125rem 0.0625rem 0 #ddda2a40',
      },
      animation: {
        marquee: 'marquee 10s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-150%)' },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      );
    }),
  ],
};
