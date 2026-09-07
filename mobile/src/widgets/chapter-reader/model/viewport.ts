import type { ChapterPage } from '@/entities/chapter';
import type { ReaderSettings } from '@/entities/user-setting';
import { darkTokens, lightTokens, type ThemeTokens } from '@/shared/theme';

export const READER_SCREEN_OPTIONS = { headerShown: false } as const;

export interface ReaderPageLayout {
    id: string;
    y: number;
    height: number;
}

export function verticalPageLayouts(
    pages: readonly ChapterPage[],
    fit: ReaderSettings['fit'],
    width: number,
    height: number,
    gap: number,
    minimumHeights: Readonly<Record<string, number>> = {},
): ReaderPageLayout[] {
    let y = 0;
    return pages.map(page => {
        const pageHeight = fit === 'WIDTH' ? (width * page.height) / page.width : fit === 'HEIGHT' ? height : page.height;
        const layout = { id: page.id, y, height: Math.max(pageHeight, minimumHeights[page.id] ?? 0) };
        y += layout.height + gap;
        return layout;
    });
}

export function pageOffset(layouts: readonly ReaderPageLayout[], pageId: string): number | null {
    return layouts.find(layout => layout.id === pageId)?.y ?? null;
}

export function pageAtOffset(layouts: readonly ReaderPageLayout[], offset: number): string | null {
    if (!layouts.length) return null;
    const ordered = [...layouts].sort((left, right) => left.y - right.y);
    return ordered.reduce((current, layout) => (layout.y <= Math.max(0, offset) ? layout.id : current), ordered[0].id);
}

export function adjacentPages(pages: readonly ChapterPage[], currentPage: number, preload: number): ChapterPage[] {
    const center = Math.min(pages.length - 1, Math.max(0, currentPage - 1));
    const radius = Math.min(10, Math.max(0, Math.trunc(preload)));
    if (!pages.length || radius === 0) return [];
    return pages.slice(Math.max(0, center - radius), Math.min(pages.length, center + radius + 1)).filter((_, index, source) => {
        const absoluteIndex = Math.max(0, center - radius) + index;
        return absoluteIndex !== center && source.length > 0;
    });
}

export const readerBackgroundColor = (background: string, fallback: ThemeTokens): string =>
    ({ BLACK: darkTokens.logoBg, DARK: darkTokens.bg, PAPER: lightTokens.surfaceMuted, LIGHT: lightTokens.bg, WHITE: lightTokens.surface })[background] ??
    fallback.bg;
