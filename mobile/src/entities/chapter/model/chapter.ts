export interface ChapterPage {
    id: string;
    order: number;
    imageUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
}

export interface Chapter {
    id: string;
    titleId: string;
    number: string;
    title: string;
    status: string;
    pages: ChapterPage[];
}

export interface ImageVariantCapabilities {
    low: boolean;
    medium: boolean;
    high: boolean;
}

const record = (value: unknown): Record<string, unknown> | null =>
    value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const nonEmptyString = (value: unknown): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null);

const positiveInteger = (value: unknown): number | null => (typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null);

export function mapChapterPage(value: unknown): ChapterPage | null {
    const source = record(value);
    if (!source) return null;

    const id = nonEmptyString(source.id);
    const order = positiveInteger(source.order);
    const imageUrl = nonEmptyString(source.imageUrl);
    const thumbnailUrl = nonEmptyString(source.thumbnailUrl);
    const width = positiveInteger(source.width);
    const height = positiveInteger(source.height);

    if (!id || order === null || !imageUrl || !thumbnailUrl || width === null || height === null) return null;

    return { id, order, imageUrl, thumbnailUrl, width, height };
}

export function normalizeChapterPages(value: unknown): ChapterPage[] {
    if (!Array.isArray(value)) return [];

    const ordered = value
        .map(mapChapterPage)
        .filter((page): page is ChapterPage => page !== null)
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
    const seenPageIds = new Set<string>();

    return ordered.filter(page => {
        if (seenPageIds.has(page.id)) return false;
        seenPageIds.add(page.id);
        return true;
    });
}

export function mapReaderChapter(value: unknown): Chapter | null {
    const source = record(value);
    if (!source) return null;

    const id = nonEmptyString(source.id);
    const titleId = nonEmptyString(source.titleId);
    const number = nonEmptyString(source.number);
    const status = nonEmptyString(source.status);
    const title = typeof source.title === 'string' ? source.title : null;

    if (!id || !titleId || !number || !status || title === null) return null;

    return {
        id,
        titleId,
        number,
        title,
        status,
        pages: normalizeChapterPages(source.pages),
    };
}

export function getImageVariantCapabilities(_pages: readonly ChapterPage[]): ImageVariantCapabilities {
    return { low: false, medium: false, high: false };
}
