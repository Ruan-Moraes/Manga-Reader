import type { ChapterPublicGateway, ReaderProgressGateway } from '../../model/admin/chapterPublicGateway.port';
import type { ReaderChapter, ReaderProgress } from '../../model/admin/chapterReader.types';
import { isChapterPubliclyVisible } from '../../model/admin/chapterStatus';
import { normalizeChapterNumber } from '../../model/admin/chapterValidation';

import type { ChapterStore } from './localStorageChapterStore';

/**
 * Leitura pública do armazenamento provisório.
 *
 * NUNCA semeia dados: com storage vazio o leitor mantém o fallback de
 * placeholders atual (e os testes existentes do reader seguem válidos).
 */
export const createLocalStorageChapterPublicGateway = (store: ChapterStore): ChapterPublicGateway => ({
    async getReaderChapter(titleId, number, opts) {
        await store.delay();
        const state = store.read();
        const normalized = normalizeChapterNumber(number);

        const chapter = state.chapters.find(c => c.titleId === titleId && !c.deletedAt && normalizeChapterNumber(c.number) === normalized);
        if (!chapter) return null;
        if (!isChapterPubliclyVisible(chapter.status) && !opts?.includeUnpublished) return 'blocked';

        const pages = state.pages
            .filter(p => p.chapterId === chapter.id && p.processingStatus === 'ready')
            .sort((a, b) => a.order - b.order)
            .map(p => ({ id: p.id, order: p.order, imageUrl: p.imageUrl, thumbnailUrl: p.thumbnailUrl, width: p.width, height: p.height }));

        return {
            id: chapter.id,
            titleId: chapter.titleId,
            number: chapter.number,
            title: chapter.title,
            status: chapter.status,
            pages,
        } satisfies ReaderChapter;
    },
});

const POS_PREFIX = 'reader:pos:';
const COMPLETED_KEY = 'reader:completed:v1';

/**
 * Progresso de leitura em localStorage — formaliza as chaves `reader:pos:*`
 * já gravadas pelo leitor (mesmo formato, sem migração).
 */
export const createLocalStorageReaderProgressGateway = (storage: Storage = window.localStorage): ReaderProgressGateway => {
    const readCompleted = (): Record<string, string[]> => {
        try {
            return JSON.parse(storage.getItem(COMPLETED_KEY) ?? '{}') as Record<string, string[]>;
        } catch {
            return {};
        }
    };

    return {
        saveProgress(titleId, chapterNumber, page) {
            try {
                storage.setItem(`${POS_PREFIX}${titleId}`, JSON.stringify({ chapter: Number(chapterNumber) || 1, page }));
            } catch {
                /* ignore */
            }
        },

        getProgress(titleId) {
            try {
                const raw = storage.getItem(`${POS_PREFIX}${titleId}`);
                if (!raw) return null;
                const pos = JSON.parse(raw) as Partial<ReaderProgress>;
                if (typeof pos.chapter !== 'number' || typeof pos.page !== 'number') return null;
                return { chapter: pos.chapter, page: pos.page };
            } catch {
                return null;
            }
        },

        markCompleted(titleId, chapterNumber) {
            try {
                const completed = readCompleted();
                const list = completed[titleId] ?? [];
                if (!list.includes(chapterNumber)) completed[titleId] = [...list, chapterNumber];
                storage.setItem(COMPLETED_KEY, JSON.stringify(completed));
            } catch {
                /* ignore */
            }
        },

        isCompleted(titleId, chapterNumber) {
            return (readCompleted()[titleId] ?? []).includes(chapterNumber);
        },
    };
};
