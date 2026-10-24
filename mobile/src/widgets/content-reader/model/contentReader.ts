import type { ReaderSettings } from '@/entities/user-setting';
import { darkTokens, lightTokens, type ThemeTokens } from '@/shared/theme';

export const READER_SCREEN_OPTIONS = { headerShown: false } as const;

export interface ReaderLocation {
    itemOffsetRatio?: number;
    itemId: string;
    index: number;
}

export interface ReaderOverlayVertex {
    index: number;
    x: number;
    y: number;
}

export interface ReaderDemoOverlay {
    id: string;
    translatedText: string;
    overflow: boolean;
    vertices: readonly ReaderOverlayVertex[];
}

export interface ImageReaderItem {
    id: string;
    primaryUri: string;
    originalUri?: string | null;
    width: number;
    height: number;
    demoOverlays?: readonly ReaderDemoOverlay[];
}

export interface ImageSequenceDocument {
    chapterNumber?: string;
    kind: 'IMAGE_SEQUENCE';
    id: string;
    title: string;
    items: readonly ImageReaderItem[];
    initialLocation?: ReaderLocation;
    sourceKind?: 'PUBLISHED' | 'DEMO' | 'REMOTE';
}

interface TextBlockBase {
    id: string;
}

export type TextReaderBlock =
    | (TextBlockBase & { type: 'heading'; text: string })
    | (TextBlockBase & { type: 'paragraph'; text: string })
    | (TextBlockBase & { type: 'dialogue'; text: string; speaker?: string })
    | (TextBlockBase & { type: 'divider' })
    | (TextBlockBase & { type: 'image'; uri: string; width: number; height: number; description: string });

export interface TextFlowDocument {
    kind: 'TEXT_FLOW';
    id: string;
    title: string;
    blocks: readonly TextReaderBlock[];
    initialLocation?: ReaderLocation;
}

export type ReaderDocument = ImageSequenceDocument | TextFlowDocument;

export interface ReaderItemLayout {
    id: string;
    y: number;
    height: number;
}

export interface OverlayBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function fittedImageSize(item: Pick<ImageReaderItem, 'width' | 'height'>, width: number, height: number, fit: ReaderSettings['fit']) {
    if (item.width <= 0 || item.height <= 0) return { width, height: width };
    const scale = fit === 'WIDTH' ? width / item.width : Math.min(width / item.width, height / item.height, fit === 'ORIGINAL' ? 1 : Infinity);
    return { width: item.width * scale, height: item.height * scale };
}

export function restoreLocationById(ids: readonly string[], location?: ReaderLocation): ReaderLocation {
    if (!ids.length) return { itemId: '', index: 0 };
    const byId = location ? ids.indexOf(location.itemId) : -1;
    const fallback = Number.isFinite(location?.index) ? Math.trunc(location!.index) : 0;
    const index = byId >= 0 ? byId : Math.min(ids.length - 1, Math.max(0, fallback));
    const ratio = location?.itemOffsetRatio;
    return {
        itemId: ids[index],
        index,
        ...(typeof ratio === 'number' && Number.isFinite(ratio) && byId >= 0 ? { itemOffsetRatio: Math.max(0, Math.min(1, ratio)) } : {}),
    };
}

export function verticalItemLayouts(
    items: readonly Pick<ImageReaderItem, 'id' | 'width' | 'height'>[],
    viewportWidth: number,
    gap: number,
    minimumHeights: Readonly<Record<string, number>> = {},
): ReaderItemLayout[] {
    let y = 0;
    return items.map(item => {
        const naturalHeight = item.width > 0 && item.height > 0 ? (viewportWidth * item.height) / item.width : viewportWidth;
        const height = Math.max(naturalHeight, minimumHeights[item.id] ?? 0);
        const layout = { id: item.id, y, height };
        y += height + gap;
        return layout;
    });
}

export function dominantVisibleItem(layouts: readonly ReaderItemLayout[], offset: number, viewportHeight: number): string | null {
    let winner: { id: string; index: number; visible: number } | null = null;
    const top = Math.max(0, offset);
    const bottom = top + Math.max(0, viewportHeight);
    for (const [index, layout] of layouts.entries()) {
        const visible = Math.max(0, Math.min(layout.y + layout.height, bottom) - Math.max(layout.y, top));
        if (visible > 0 && (!winner || visible > winner.visible || (visible === winner.visible && index < winner.index))) {
            winner = { id: layout.id, index, visible };
        }
    }
    return winner?.id ?? layouts[0]?.id ?? null;
}

export function overlayBox(vertices: readonly ReaderOverlayVertex[]): OverlayBox | null {
    if (!vertices.length || vertices.some(vertex => !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y))) return null;
    const xs = vertices.map(vertex => Math.min(1, Math.max(0, vertex.x)));
    const ys = vertices.map(vertex => Math.min(1, Math.max(0, vertex.y)));
    const left = Math.min(...xs);
    const top = Math.min(...ys);
    const right = Math.max(...xs);
    const bottom = Math.max(...ys);
    if (right <= left || bottom <= top) return null;
    return { left, top, width: right - left, height: bottom - top };
}

export function effectiveImageMode(settings: ReaderSettings): ReaderSettings['mode'] {
    return settings.direction === 'WEBTOON' ? 'VERTICAL' : settings.mode;
}

export function groupedImageItems(items: readonly ImageReaderItem[], settings: ReaderSettings): readonly (readonly ImageReaderItem[])[] {
    if (effectiveImageMode(settings) !== 'DOUBLE') return items.map(item => [item]);
    const groups: ImageReaderItem[][] = [];
    for (let index = 0; index < items.length; index += 2) {
        const pair = items.slice(index, index + 2);
        groups.push(settings.direction === 'RTL' ? pair.reverse() : pair);
    }
    return groups;
}

export const readerBackgroundColor = (background: string, fallback: ThemeTokens): string =>
    ({ BLACK: darkTokens.logoBg, DARK: darkTokens.bg, PAPER: lightTokens.surfaceMuted, LIGHT: lightTokens.bg, WHITE: lightTokens.surface })[background] ??
    fallback.bg;
