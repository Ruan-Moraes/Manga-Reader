/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          default: '#161616',
          'opacity-50': '#16161680',
        },
        secondary: '#252526',
        tertiary: '#727273',
        quaternary: {
          'opacity-25': '#ddda2a40',
          normal: '#ddda2a',
        },
      },
      boxShadow: {
        default: '0.25rem 0.25rem 0px 0px #ddda2a40',
        inside: '0px 0px 0.075rem 0.25rem #ddda2a40',
      },
    },
  },
  plugins: [],
};
