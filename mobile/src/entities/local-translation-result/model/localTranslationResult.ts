export const LOCAL_RESULT_SOURCES = ['DEMO', 'REMOTE'] as const;
export type LocalResultSource = (typeof LOCAL_RESULT_SOURCES)[number];

export interface TextRegionVertex {
    index: number;
    x: number;
    y: number;
}

export interface TranslationMetadata {
    contractVersion: string;
    model: string;
    translatedAt: number;
}

export interface TextRegion {
    id: string;
    pageId: string;
    readingOrder: number;
    sourceText: string;
    translatedText: string;
    translationMetadata: TranslationMetadata | null;
    overflow: boolean;
    createdAt: number;
    vertices: TextRegionVertex[];
}

export interface LocalTranslationResult {
    pageId: string;
    attemptId: string | null;
    sourceKind: LocalResultSource;
    renderedFilename: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    byteSize: number;
    widthPx: number;
    heightPx: number;
    sha256: string;
    readyAt: number;
    autoOpenedAt: number | null;
    regions: TextRegion[];
}

export type NewLocalTranslationResult = LocalTranslationResult;

export function isLocalResultSource(value: unknown): value is LocalResultSource {
    return typeof value === 'string' && LOCAL_RESULT_SOURCES.some(source => source === value);
}
