import type { ChapterPublicGateway } from '../../model/admin/chapterPublicGateway.port';
import type { ReaderChapter } from '../../model/admin/chapterReader.types';
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
