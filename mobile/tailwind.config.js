/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mr: {
          bg: '#161616',
          surface: '#252526',
          accent: '#ddda2a',
          danger: '#FF784F',
          text: '#ffffff',
          muted: '#727273',
          separator: '#242424',
          gray: {
            200: '#cccccc',
            300: '#999999',
            400: '#777777',
            500: '#727273',
            600: '#555555',
            700: '#444444',
            800: '#2d2d2d',
            900: '#1a1a1a',
          },
        },
      },
    },
  },
  plugins: [],
};
