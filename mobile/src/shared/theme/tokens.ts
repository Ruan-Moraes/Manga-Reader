/** Paleta de design tokens — usada por ThemeProvider e NativeWind.
 *  Regra: nenhum componente usa valores literais de cor; sempre via token.
 */

export interface ThemeTokens {
    // Backgrounds
    bg: string;
    surface: string;
    surfaceMuted: string;
    surfaceElevated: string;
    surfacePressed: string;
    surfaceSelected: string;
    disabledSurface: string;
    inputBg: string;
    // Borders
    inputBorder: string;
    separator: string;
    divider: string;
    borderStrong: string;
    // Brand
    accent: string;
    accentText: string;
    onAccent: string;
    accentSoft: string;
    accentBorder: string;
    accentGlow: string;
    focus: string;
    link: string;
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
    scrim: string;
    logoBg: string;
    heroSurface: string;
    heroAccent: string;
    heroLine: string;
}

export const darkTokens: ThemeTokens = {
    bg: '#11110F',
    surface: '#1B1B18',
    surfaceMuted: '#24231F',
    surfaceElevated: '#2B2A25',
    surfacePressed: '#34332D',
    surfaceSelected: 'rgba(230,224,55,0.12)',
    disabledSurface: '#24231F',
    inputBg: '#1B1B18',
    inputBorder: '#3A3932',
    separator: '#34332D',
    divider: '#34332D',
    borderStrong: '#514F46',
    accent: '#E6E037',
    accentText: '#E6E037',
    onAccent: '#151510',
    accentSoft: 'rgba(230,224,55,0.12)',
    accentBorder: 'rgba(230,224,55,0.52)',
    accentGlow: 'rgba(230,224,55,0.20)',
    focus: '#E6E037',
    link: '#E6E037',
    danger: '#FF8A68',
    success: '#10b981',
    warn: '#e0a32e',
    text: '#F7F4EA',
    inverseText: '#151510',
    muted: '#C8C2B6',
    subtle: '#918B80',
    tertiary: '#777268',
    placeholder: '#777268',
    disabled: '#6D685F',
    overlay: 'rgba(0,0,0,0.78)',
    scrim: 'rgba(0,0,0,0.72)',
    logoBg: '#000000',
    heroSurface: '#5A5953',
    heroAccent: '#E6E037',
    heroLine: 'rgba(247,244,234,0.28)',
};

export const lightTokens: ThemeTokens = {
    bg: '#F6F4EE',
    surface: '#FFFEFA',
    surfaceMuted: '#EFEDE5',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#E5E1D7',
    surfaceSelected: 'rgba(220,214,41,0.16)',
    disabledSurface: '#EFEDE5',
    inputBg: '#FFFEFA',
    inputBorder: '#C9C3B5',
    separator: '#DDD8CA',
    divider: '#DDD8CA',
    borderStrong: '#B7AF9E',
    accent: '#DCD629',
    accentText: '#666200',
    onAccent: '#171712',
    accentSoft: 'rgba(102,98,0,0.09)',
    accentBorder: 'rgba(102,98,0,0.44)',
    accentGlow: 'rgba(220,214,41,0.22)',
    focus: '#666200',
    link: '#575300',
    danger: '#b83d1b',
    success: '#087a4f',
    warn: '#845500',
    text: '#1B1A17',
    inverseText: '#ffffff',
    muted: '#57544D',
    subtle: '#767168',
    tertiary: '#8A857B',
    placeholder: '#8A857B',
    disabled: '#9E988D',
    overlay: 'rgba(10,10,10,0.68)',
    scrim: 'rgba(10,10,10,0.56)',
    logoBg: '#000000',
    heroSurface: '#77766F',
    heroAccent: '#F2ED84',
    heroLine: 'rgba(255,254,250,0.38)',
};

export type ColorScheme = 'dark' | 'light';
