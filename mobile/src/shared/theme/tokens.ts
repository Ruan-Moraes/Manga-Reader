/** Paleta de design tokens — usada por ThemeProvider e NativeWind.
 *  Regra: nenhum componente usa valores literais de cor; sempre via token.
 */

export interface ThemeTokens {
    // Backgrounds
    bg: string;
    surface: string;
    surfaceMuted: string;
    surfaceElevated: string;
    inputBg: string;
    // Borders
    inputBorder: string;
    separator: string;
    divider: string;
    // Brand
    accent: string;
    accentText: string;
    onAccent: string;
    accentSoft: string;
    accentBorder: string;
    accentGlow: string;
    // Semantic
    danger: string;
    success: string;
    warn: string;
    // Text
    text: string;
    inverseText: string;
    muted: string;
    subtle: string;
    tertiary: string;
    placeholder: string;
    disabled: string;
    overlay: string;
    logoBg: string;
    // Layout
    ls: number;
    radius: number;
    controlHeight: number;
    screenPadding: number;
}

export const darkTokens: ThemeTokens = {
    bg: '#161616',
    surface: '#252526',
    surfaceMuted: '#1a1a1a',
    surfaceElevated: '#2d2d2d',
    inputBg: '#0f0f0f',
    inputBorder: '#2a2a2a',
    separator: '#242424',
    divider: '#242424',
    accent: '#ddda2a',
    accentText: '#ddda2a',
    onAccent: '#161616',
    accentSoft: 'rgba(221,218,42,0.10)',
    accentBorder: 'rgba(221,218,42,0.50)',
    accentGlow: 'rgba(221,218,42,0.25)',
    danger: '#FF784F',
    success: '#10b981',
    warn: '#e0a32e',
    text: '#ffffff',
    inverseText: '#161616',
    muted: '#cccccc',
    subtle: '#999999',
    tertiary: '#727273',
    placeholder: '#727273',
    disabled: '#727273',
    overlay: 'rgba(0,0,0,0.78)',
    logoBg: '#000000',
    ls: 1,
    radius: 2,
    controlHeight: 52,
    screenPadding: 16,
};

export const lightTokens: ThemeTokens = {
    bg: '#f7f7f4',
    surface: '#ffffff',
    surfaceMuted: '#f0f0eb',
    surfaceElevated: '#e4e4de',
    inputBg: '#ffffff',
    inputBorder: '#adada6',
    separator: '#deded9',
    divider: '#deded9',
    accent: '#ddda2a',
    accentText: '#666400',
    onAccent: '#161616',
    accentSoft: 'rgba(102,100,0,0.10)',
    accentBorder: 'rgba(102,100,0,0.55)',
    accentGlow: 'rgba(102,100,0,0.18)',
    danger: '#b83d1b',
    success: '#087a4f',
    warn: '#845500',
    text: '#171717',
    inverseText: '#ffffff',
    muted: '#343431',
    subtle: '#555550',
    tertiary: '#656565',
    placeholder: '#656565',
    disabled: '#777770',
    overlay: 'rgba(10,10,10,0.68)',
    logoBg: '#000000',
    ls: 1,
    radius: 2,
    controlHeight: 52,
    screenPadding: 16,
};

export type ColorScheme = 'dark' | 'light';
