/** Paleta de design tokens — usada por ThemeProvider e NativeWind.
 *  Regra: nenhum componente usa valores literais de cor; sempre via token.
 */

export interface ThemeTokens {
    // Backgrounds
    bg: string;
    surface: string;
    inputBg: string;
    // Borders
    inputBorder: string;
    separator: string;
    // Brand
    accent: string;
    accentGlow: string;
    // Semantic
    danger: string;
    success: string;
    warn: string;
    // Text
    text: string;
    muted: string;
    subtle: string;
    tertiary: string;
    // Layout
    ls: number;
    radius: number;
    controlHeight: number;
    screenPadding: number;
}

export const darkTokens: ThemeTokens = {
    bg: '#161616',
    surface: '#252526',
    inputBg: '#0f0f0f',
    inputBorder: '#2a2a2a',
    separator: '#242424',
    accent: '#ddda2a',
    accentGlow: 'rgba(221,218,42,0.25)',
    danger: '#FF784F',
    success: '#10b981',
    warn: '#e0a32e',
    text: '#ffffff',
    muted: '#cccccc',
    subtle: '#999999',
    tertiary: '#727273',
    ls: 1,
    radius: 2,
    controlHeight: 52,
    screenPadding: 16,
};

export const lightTokens: ThemeTokens = {
    bg: '#f5f5f5',
    surface: '#ffffff',
    inputBg: '#fafafa',
    inputBorder: '#d1d1d1',
    separator: '#e5e5e5',
    accent: '#b8b500',
    accentGlow: 'rgba(184,181,0,0.2)',
    danger: '#e05a2b',
    success: '#0d9668',
    warn: '#c08020',
    text: '#111111',
    muted: '#333333',
    subtle: '#555555',
    tertiary: '#888888',
    ls: 1,
    radius: 2,
    controlHeight: 52,
    screenPadding: 16,
};

export type ColorScheme = 'dark' | 'light';
