import type { ChapterPage } from '@/entities/chapter';
import type { ReadingDirection, ReadingMode } from '@/entities/user-setting';

export type ReaderItem = readonly ChapterPage[];

export function effectiveReaderMode(mode: ReadingMode, direction: ReadingDirection): ReadingMode {
    return direction === 'WEBTOON' ? 'VERTICAL' : mode;
}

export function buildReaderItems(pages: readonly ChapterPage[], mode: ReadingMode, direction: ReadingDirection): ReaderItem[] {
    const effectiveMode = effectiveReaderMode(mode, direction);
    if (effectiveMode !== 'DOUBLE') return pages.map(page => [page]);

    const items: ReaderItem[] = [];
    for (let index = 0; index < pages.length; index += 2) {
        const pair = pages.slice(index, index + 2);
        items.push(direction === 'RTL' ? [...pair].reverse() : pair);
    }
    return items;
}

export function logicalItemIndex(items: readonly ReaderItem[], pageId: string): number {
    const index = items.findIndex(item => item.some(page => page.id === pageId));
    return index < 0 ? 0 : index;
}

export function clampLogicalPage(page: number, totalPages: number): number {
    if (!Number.isFinite(page) || totalPages < 1) return 1;
    return Math.min(totalPages, Math.max(1, Math.trunc(page)));
}
