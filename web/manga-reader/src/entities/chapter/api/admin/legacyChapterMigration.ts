import type { ChapterPage, LegacyChapterImportPayload } from '../../model/admin/chapterAdmin.types';

export const CHAPTER_STORE_KEY = 'mr:chapters:admin:v1';

export type LegacyChapterPreview = {
    payload: LegacyChapterImportPayload;
    chaptersCount: number;
    pagesCount: number;
    ignoredDeletedCount: number;
};

export type LegacyChapterReadResult =
    | { kind: 'none' }
    | { kind: 'invalid'; reason: string }
    | { kind: 'ready'; preview: LegacyChapterPreview };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const requiredString = (record: Record<string, unknown>, key: string): string => {
    const value = record[key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Campo inválido: ${key}`);
    return value;
};
const optionalString = (value: unknown): string | null | undefined => value == null ? value as null | undefined : typeof value === 'string' ? value : undefined;

export const readLegacyChapterImport = (storage: Storage = window.localStorage): LegacyChapterReadResult => {
    const raw = storage.getItem(CHAPTER_STORE_KEY);
    if (!raw) return { kind: 'none' };

    try {
        const state = JSON.parse(raw) as unknown;
        if (!isRecord(state) || !Array.isArray(state.chapters) || !Array.isArray(state.pages)) {
            throw new Error('Estrutura legada não reconhecida');
        }
        if (state.chapters.length > 1000 || state.pages.length > 500_000) {
            throw new Error('O arquivo legado excede o limite seguro');
        }
        const pages = state.pages.filter(isRecord);
        let ignoredDeletedCount = 0;
        const chapters = state.chapters.filter(isRecord).flatMap(chapter => {
            if (chapter.deletedAt) {
                ignoredDeletedCount++;
                return [];
            }
            const legacyId = requiredString(chapter, 'id');
            const chapterPages = pages.filter(page => page.chapterId === legacyId).map((page, index) => ({
                id: requiredString(page, 'id'),
                order: typeof page.order === 'number' ? page.order : index + 1,
                originalFilename: requiredString(page, 'originalFilename'),
                imageUrl: requiredString(page, 'imageUrl'),
                thumbnailUrl: requiredString(page, 'thumbnailUrl'),
                width: typeof page.width === 'number' ? page.width : 0,
                height: typeof page.height === 'number' ? page.height : 0,
                fileSize: typeof page.fileSize === 'number' ? page.fileSize : 0,
                format: requiredString(page, 'format') as ChapterPage['format'],
                processingStatus: requiredString(page, 'processingStatus') as ChapterPage['processingStatus'],
                createdAt: requiredString(page, 'createdAt'),
                updatedAt: requiredString(page, 'updatedAt'),
            }));
            return [{
                legacyId,
                titleId: requiredString(chapter, 'titleId'),
                title: requiredString(chapter, 'title'),
                number: requiredString(chapter, 'number'),
                displayOrder: typeof chapter.displayOrder === 'number' ? chapter.displayOrder : undefined,
                description: optionalString(chapter.description),
                status: requiredString(chapter, 'status'),
                scheduledAt: optionalString(chapter.scheduledAt),
                publishedAt: optionalString(chapter.publishedAt),
                createdAt: optionalString(chapter.createdAt),
                updatedAt: optionalString(chapter.updatedAt),
                pages: chapterPages,
            }];
        });
        if (!chapters.length) throw new Error('Nenhum capítulo ativo para importar');
        return { kind: 'ready', preview: { payload: { chapters }, chaptersCount: chapters.length,
            pagesCount: chapters.reduce((total, chapter) => total + chapter.pages.length, 0), ignoredDeletedCount } };
    } catch (error) {
        return { kind: 'invalid', reason: error instanceof Error ? error.message : 'Estrutura legada inválida' };
    }
};
