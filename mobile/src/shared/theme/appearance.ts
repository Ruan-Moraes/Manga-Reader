import { Platform, type TextStyle } from 'react-native';

import { FONTS } from './fonts';
import type { ColorScheme, ThemeTokens } from './tokens';

export type ThemePreference = 'DARK' | 'LIGHT' | 'SYSTEM';
export type FontSizePreference = 'COMPACT' | 'DEFAULT' | 'COMFORTABLE';
export type DensityPreference = 'COMFORTABLE' | 'COMPACT';

export type TypographyRole = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'minimum';
export type SpacingRole = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export type TypographyScale = Record<TypographyRole, number>;
export type SpacingScale = Record<SpacingRole, number>;
export type RadiusRole = 'sm' | 'control' | 'card' | 'feature' | 'pill';
export type TypographyStyleRole = 'display' | 'title' | 'section' | 'body' | 'label' | 'caption' | 'eyebrow' | 'button';

export type RadiusScale = Record<RadiusRole, number>;
export interface LayoutScale {
    screenGutter: number;
    sectionGap: number;
    controlHeight: number;
    compactControlHeight: number;
}
export type TypographyStyleScale = Record<TypographyStyleRole, TextStyle>;

export const TYPOGRAPHY_SCALES: Record<FontSizePreference, TypographyScale> = {
    COMPACT: { h1: 30, h2: 22, h3: 18, h4: 15, body: 13, small: 11, minimum: 10 },
    DEFAULT: { h1: 32, h2: 24, h3: 20, h4: 16, body: 14, small: 12, minimum: 11 },
    COMFORTABLE: { h1: 34, h2: 26, h3: 22, h4: 17, body: 15, small: 13, minimum: 12 },
};

export const SPACING_SCALES: Record<DensityPreference, SpacingScale> = {
    COMFORTABLE: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64 },
    COMPACT: { xs: 4, sm: 6, md: 12, lg: 18, xl: 24, '2xl': 36, '3xl': 48 },
};

export const RADII: RadiusScale = { sm: 8, control: 12, card: 16, feature: 24, pill: 999 };

export const LAYOUT_SCALES: Record<DensityPreference, LayoutScale> = {
    COMFORTABLE: { screenGutter: 20, sectionGap: 32, controlHeight: 52, compactControlHeight: 44 },
    COMPACT: { screenGutter: 16, sectionGap: 24, controlHeight: 52, compactControlHeight: 44 },
};

export function createTypographyStyles(scale: TypographyScale): TypographyStyleScale {
    return {
        display: { fontFamily: FONTS.extrabold, fontSize: scale.h1, lineHeight: scale.h1 * 1.12, letterSpacing: -0.7 },
        title: { fontFamily: FONTS.bold, fontSize: scale.h2, lineHeight: scale.h2 * 1.18, letterSpacing: -0.35 },
        section: { fontFamily: FONTS.bold, fontSize: scale.h3, lineHeight: scale.h3 * 1.25, letterSpacing: -0.15 },
        body: { fontFamily: FONTS.regular, fontSize: scale.body, lineHeight: scale.body * 1.5, letterSpacing: 0 },
        label: { fontFamily: FONTS.bold, fontSize: scale.body, lineHeight: scale.body * 1.35, letterSpacing: 0 },
        caption: { fontFamily: FONTS.regular, fontSize: scale.small, lineHeight: scale.small * 1.45, letterSpacing: 0 },
        eyebrow: { fontFamily: FONTS.extrabold, fontSize: scale.minimum, lineHeight: scale.minimum * 1.35, letterSpacing: 1.15, textTransform: 'uppercase' },
        button: { fontFamily: FONTS.bold, fontSize: scale.body, lineHeight: scale.body * 1.3, letterSpacing: 0.1 },
    };
}

export const minimumTouchTarget = (platform: typeof Platform.OS = Platform.OS): number => (platform === 'ios' ? 44 : 48);

export const resolveColorScheme = (preference: ThemePreference, systemScheme: ColorScheme | null | undefined): ColorScheme => {
    if (preference === 'DARK') return 'dark';

    if (preference === 'LIGHT') return 'light';

    return systemScheme === 'dark' ? 'dark' : 'light';
};

export const resolveEffectiveReduceMotion = (manual: boolean, system: boolean): boolean => manual || system;
export const resolveEffectiveHighContrast = (manual: boolean, system: boolean): boolean => manual || system;
export const resolveDecorativeMotion = (animations: boolean, effectiveReduceMotion: boolean): boolean => animations && !effectiveReduceMotion;

export const darkHighContrastTokens: ThemeTokens = {
    bg: '#000000',
    surface: '#181818',
    surfaceMuted: '#0d0d0d',
    surfaceElevated: '#181818',
    surfacePressed: '#333333',
    surfaceSelected: '#181818',
    disabledSurface: '#0d0d0d',
    inputBg: '#000000',
    inputBorder: '#8c8c8c',
    separator: '#b0b0b0',
    divider: '#b0b0b0',
    borderStrong: '#b0b0b0',
    accent: '#fff86a',
    accentText: '#fff86a',
    onAccent: '#000000',
    accentSoft: '#181818',
    accentBorder: '#fff86a',
    accentGlow: '#fff86a',
    focus: '#fff86a',
    link: '#fff86a',
    danger: '#ff8a70',
    success: '#69f0ae',
    warn: '#ffe082',
    text: '#ffffff',
    inverseText: '#000000',
    muted: '#f2f2f2',
    subtle: '#d8d8d8',
    tertiary: '#d8d8d8',
    placeholder: '#d8d8d8',
    disabled: '#8c8c8c',
    overlay: '#000000',
    scrim: '#000000',
    logoBg: '#000000',
    heroSurface: '#181818',
    heroAccent: '#fff86a',
    heroLine: '#b0b0b0',
};

export const lightHighContrastTokens: ThemeTokens = {
    bg: '#ffffff',
    surface: '#ffffff',
    surfaceMuted: '#f5f5f5',
    surfaceElevated: '#f5f5f5',
    surfacePressed: '#e5e5e5',
    surfaceSelected: '#f5f5f5',
    disabledSurface: '#f5f5f5',
    inputBg: '#ffffff',
    inputBorder: '#1f1f1f',
    separator: '#333333',
    divider: '#333333',
    borderStrong: '#333333',
    accent: '#4d4a00',
    accentText: '#4d4a00',
    onAccent: '#ffffff',
    accentSoft: '#f5f5f5',
    accentBorder: '#4d4a00',
    accentGlow: '#4d4a00',
    focus: '#4d4a00',
    link: '#333100',
    danger: '#8f1d00',
    success: '#005a32',
    warn: '#664000',
    text: '#000000',
    inverseText: '#ffffff',
    muted: '#1f1f1f',
    subtle: '#333333',
    tertiary: '#333333',
    placeholder: '#333333',
    disabled: '#666666',
    overlay: '#000000',
    scrim: 'rgba(0,0,0,0.72)',
    logoBg: '#000000',
    heroSurface: '#333333',
    heroAccent: '#fff86a',
    heroLine: '#ffffff',
};

export function resolveThemeTokens(colorScheme: ColorScheme, highContrast: boolean, normal: Record<ColorScheme, ThemeTokens>): ThemeTokens {
    if (!highContrast) return normal[colorScheme];

    return colorScheme === 'dark' ? darkHighContrastTokens : lightHighContrastTokens;
}
