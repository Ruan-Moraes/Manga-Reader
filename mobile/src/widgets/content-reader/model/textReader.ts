import type { TextStyle } from 'react-native';

import type { TextReaderPreferences } from '@/entities/user-setting';
import { type ColorScheme, darkTokens, FONTS, lightTokens, resolveThemeTokens, type ThemeTokens } from '@/shared/theme';

import type { ReaderItemLayout, ReaderLocation, TextReaderBlock } from './contentReader';

export const TEXT_COLUMN_WIDTH = 640;
export const TEXT_MARGINS = { NARROW: 12, MEDIUM: 20, WIDE: 28 } as const;
const LINE_SPACING = { COMPACT: 1.4, COMFORTABLE: 1.65, WIDE: 1.9 } as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function textReaderTypography(preferences: TextReaderPreferences, platform: string): TextStyle {
    return {
        fontFamily: preferences.fontFamily === 'SERIF' ? (platform === 'ios' ? 'Georgia' : 'serif') : FONTS.regular,
        fontSize: preferences.fontSize,
        lineHeight: Math.round(preferences.fontSize * LINE_SPACING[preferences.lineSpacing] * 100) / 100,
        textAlign: 'left',
    };
}

export function textReaderPalette(background: TextReaderPreferences['background'], appTokens: ThemeTokens, appScheme: ColorScheme, highContrast: boolean) {
    if (background === 'APP') return { tokens: appTokens, colorScheme: appScheme };
    const colorScheme = background === 'DARK' ? 'dark' : 'light';
    const base = resolveThemeTokens(colorScheme, highContrast, { dark: darkTokens, light: lightTokens });
    const tokens = background === 'PAPER' && !highContrast ? { ...base, bg: lightTokens.surfaceMuted, surface: lightTokens.surfaceMuted } : base;
    return { tokens, colorScheme } as const;
}

export function captureTextAnchor(layouts: readonly ReaderItemLayout[], offset: number): ReaderLocation {
    let index = 0;
    layouts.forEach((box, i) => {
        if (box.y <= offset) index = i;
    });
    const box = layouts[index];
    return { itemId: box?.id ?? '', index, itemOffsetRatio: box ? clamp((offset - box.y) / Math.max(1, box.height)) : 0 };
}

export function textRestoreOffset(box: ReaderItemLayout, location: ReaderLocation, readingInset: number): number {
    return Math.max(0, box.y + clamp(location.itemOffsetRatio ?? 0) * box.height - readingInset);
}

export function textReadingPercent(
    blocks: readonly TextReaderBlock[],
    layouts: readonly ReaderItemLayout[],
    offset: number,
    viewportHeight: number,
    contentHeight: number,
): number {
    if (contentHeight > 0 && (contentHeight <= viewportHeight || offset + viewportHeight >= contentHeight - 1)) return 100;
    const weights = blocks.map(block => ('text' in block ? block.text.length : 0));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (!total) return 0;
    const anchor = captureTextAnchor(layouts, offset);
    const read = weights.slice(0, anchor.index).reduce((sum, weight) => sum + weight, 0) + (weights[anchor.index] ?? 0) * (anchor.itemOffsetRatio ?? 0);
    return Math.min(99, Math.floor(clamp(read / total) * 100));
}

export function estimatedTextLayouts(
    blocks: readonly TextReaderBlock[],
    measured: ReadonlyMap<string, ReaderItemLayout>,
    width: number,
    typography: TextStyle,
    fontScale: number,
    top: number,
    gap: number,
): ReaderItemLayout[] {
    let y = top;
    return blocks.map(block => {
        const measuredBox = measured.get(block.id);
        const lines = 'text' in block ? Math.max(1, Math.ceil((block.text.length * Number(typography.fontSize) * fontScale * 0.55) / Math.max(1, width))) : 1;
        const estimatedHeight = block.type === 'image' ? (width * block.height) / Math.max(1, block.width) : lines * Number(typography.lineHeight) * fontScale;
        const box = measuredBox ?? { id: block.id, y, height: estimatedHeight + gap };
        y = box.y + box.height;
        return box;
    });
}
