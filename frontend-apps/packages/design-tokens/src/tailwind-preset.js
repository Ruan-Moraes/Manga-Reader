import plugin from 'tailwindcss/plugin';
import { colors, screens, boxShadow, textShadow, animation, keyframes } from './index.js';

/**
 * Tailwind CSS preset with Manga Reader brand tokens.
 * Usage: import preset in tailwind.config.js and add to `presets: [mangaReaderPreset]`.
 */
const mangaReaderPreset = {
    theme: {
        extend: {
            screens,
            colors,
            boxShadow,
            textShadow,
            transitionProperty: {
                'text-shadow': 'text-shadow',
            },
            animation,
            keyframes,
        },
    },
    plugins: [
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                {
                    'text-shadow': value => ({
                        textShadow: value,
                    }),
                },
                { values: theme('textShadow') },
            );
        }),
    ],
};

export default mangaReaderPreset;
