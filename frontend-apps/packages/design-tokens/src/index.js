/**
 * Manga Reader brand color tokens.
 * Single source of truth for all frontend projects.
 */
export const colors = {
    primary: {
        default: '#161616',
        opacity: {
            80: '#161616cc',
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
            75: '#ddda2abf',
        },
    },
    quinary: {
        default: '#FF784F',
    },
};

export const screens = {
    'mobile-sm': '20rem',
    'mobile-md': '23.4375rem',
    'mobile-lg': '26.5625rem',
};

export const boxShadow = {
    black: '0 0 2rem 0.25rem #161616bf',
    default: '0.25rem 0.25rem 0 0 #ddda2a40',
    inside: '0 0 0.075rem 0.25rem #ddda2a40',
    elevated: '-0.25rem 0.25rem 0 0 #ddda2a40',
};

export const textShadow = {
    default: '0.125rem 0.0625rem 0 #161616bf',
    highlight: '0.125rem 0.0625rem 0 #ddda2a40',
};

export const animation = {
    marquee: 'marquee 20s linear infinite',
};

export const keyframes = {
    marquee: {
        '0%': { transform: 'translateX(125%)' },
        '100%': { transform: 'translateX(-150%)' },
    },
};
