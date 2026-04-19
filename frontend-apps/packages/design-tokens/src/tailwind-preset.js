import plugin from 'tailwindcss/plugin';

import { colors, screens, boxShadow, textShadow, animation, keyframes } from './index.js';

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
