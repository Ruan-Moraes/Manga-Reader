import type { PageResponse } from '@shared/service/http';

import type {
    AdminChapter,
    BulkResult,
    ChapterListQuery,
    ChapterPage,
    ChapterStatus,
    CreateChapterRequest,
    NewPageInput,
    UpdateChapterRequest,
} from '../../model/admin/chapterAdmin.types';
import type { ChapterAdminGateway } from '../../model/admin/chapterAdminGateway.port';
import { ChapterDomainError } from '../../model/admin/chapterErrors';
import { nextFreeChapterNumber, normalizeChapterNumber, validateChapterInput, validateReorder, validateStatusChange } from '../../model/admin/chapterValidation';

import type { ChapterStore, ChapterStoreState } from './localStorageChapterStore';

/**
 * Implementação provisória do {@link ChapterAdminGateway} sobre localStorage.
 *
 * Valida com as mesmas funções puras do domínio (papel de "servidor") e
 * resolve paginação/busca/filtros/ordenação internamente — a UI nunca recebe
 * o conjunto completo. Substituível por um service axios sem tocar nos
 * consumidores (ver `chapterGateways.ts`).
 */

const activeOf = (state: ChapterStoreState, titleId: string): AdminChapter[] => state.chapters.filter(c => c.titleId === titleId && !c.deletedAt);

const findOrThrow = (state: ChapterStoreState, chapterId: string): AdminChapter => {
    const chapter = state.chapters.find(c => c.id === chapterId && !c.deletedAt);
    if (!chapter) throw new ChapterDomainError({ code: 'chapter_not_found' });
    return chapter;
};

const siblingNumbers = (state: ChapterStoreState, titleId: string, excludeId?: string): string[] =>
    activeOf(state, titleId)
        .filter(c => c.id !== excludeId)
        .map(c => c.number);

const sortChapters = (chapters: AdminChapter[], sort: ChapterListQuery['sort'], direction: 'asc' | 'desc'): AdminChapter[] => {
    const factor = direction === 'desc' ? -1 : 1;
    const sorted = [...chapters];
    switch (sort) {
        case 'publishedAt':
            sorted.sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '') * factor);
            break;
        case 'updatedAt':
            sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) * factor);
            break;
        case 'reads':
            sorted.sort((a, b) => (a.reads - b.reads) * factor);
            break;
        default:
            // Numérico, nunca lexicográfico ("10" > "2").
            sorted.sort((a, b) => (parseFloat(a.number) - parseFloat(b.number)) * factor);
    }
    return sorted;
};

export const createLocalStorageChapterAdminGateway = (store: ChapterStore): ChapterAdminGateway => {
    const touch = (chapter: AdminChapter) => {
        chapter.updatedAt = store.now().toISOString();
        chapter.updatedBy = 'admin';
    };

    /** Renumera as páginas do capítulo (1..N) e sincroniza os contadores. */
    const renumberAndSyncCounters = (state: ChapterStoreState, chapter: AdminChapter) => {
        const chapterPages = state.pages.filter(p => p.chapterId === chapter.id).sort((a, b) => a.order - b.order);
        chapterPages.forEach((p, i) => (p.order = i + 1));
        chapter.pagesCount = chapterPages.length;
        chapter.readyPagesCount = chapterPages.filter(p => p.processingStatus === 'ready').length;
        touch(chapter);
    };

    const changeStatusInState = (chapter: AdminChapter, status: ChapterStatus, scheduledAt?: string): void => {
        const error = validateStatusChange(chapter, status, {
            readyPagesCount: chapter.readyPagesCount,
            now: store.now(),
            scheduledAt,
        });
        if (error) throw new ChapterDomainError(error);

        chapter.status = status;
        if (status === 'published') {
            chapter.publishedAt = chapter.publishedAt ?? store.now().toISOString();
            chapter.scheduledAt = null;
        } else if (status === 'scheduled') {
            chapter.scheduledAt = scheduledAt ?? null;
        }
        touch(chapter);
    };

    return {
        async list(query) {
            await store.delay();
            store.ensureSeededCatalog();
            const state = store.read();

            let rows = state.chapters.filter(c => query.includeDeleted || !c.deletedAt);

            if (query.titleId) rows = rows.filter(c => c.titleId === query.titleId);
            if (query.status?.length) rows = rows.filter(c => query.status!.includes(c.status));
            if (query.publishedFrom) rows = rows.filter(c => c.publishedAt && c.publishedAt >= query.publishedFrom!);
            if (query.publishedTo) rows = rows.filter(c => c.publishedAt && c.publishedAt <= query.publishedTo!);
            if (query.search?.trim()) {
                const term = query.search.trim().toLowerCase();
                rows = rows.filter(c => c.title.toLowerCase().includes(term) || c.number.startsWith(term));
            }

            rows = sortChapters(rows, query.sort ?? 'number', query.direction ?? 'asc');

            const totalElements = rows.length;
            const totalPages = Math.max(1, Math.ceil(totalElements / query.size));
            const content = rows.slice(query.page * query.size, (query.page + 1) * query.size);

            return { content, page: query.page, size: query.size, totalElements, totalPages, last: query.page >= totalPages - 1 } satisfies PageResponse<AdminChapter>;
        },

        async getById(chapterId) {
            await store.delay();
            return { ...findOrThrow(store.read(), chapterId) };
        },

        async create(data: CreateChapterRequest) {
            await store.delay();
            let created: AdminChapter | undefined;

            store.write(state => {
                const errors = validateChapterInput(data, siblingNumbers(state, data.titleId));
                if (errors.length) throw new ChapterDomainError(errors[0]);

                const status = data.status ?? 'draft';
                // Publicar direto na criação exige páginas — capítulo novo nunca tem;
                // mesma regra do changeStatus, rejeitada com o code do domínio.
                if (status === 'published') throw new ChapterDomainError({ code: 'publish_requires_pages' });

                const nowIso = store.now().toISOString();
                const siblings = activeOf(state, data.titleId);

                created = {
                    id: store.newId('ch'),
                    titleId: data.titleId,
                    titleName: store.titleNameFor(data.titleId),
                    title: data.title.trim(),
                    number: normalizeChapterNumber(data.number),
                    displayOrder: data.displayOrder ?? siblings.length + 1,
                    description: data.description?.trim() || null,
                    status,
                    pagesCount: 0,
                    readyPagesCount: 0,
                    publishedAt: null,
                    scheduledAt: status === 'scheduled' ? (data.scheduledAt ?? null) : null,
                    reads: 0,
                    completionRate: 0,
                    createdAt: nowIso,
                    updatedAt: nowIso,
                    createdBy: 'admin',
                    updatedBy: null,
                    deletedAt: null,
                };

                state.chapters.push(created);
            });

            return created!;
        },

        async update(chapterId, data: UpdateChapterRequest) {
            await store.delay();
            let updated: AdminChapter | undefined;

            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                const errors = validateChapterInput({ ...data, titleId: chapter.titleId }, siblingNumbers(state, chapter.titleId, chapterId));
                if (errors.length) throw new ChapterDomainError(errors[0]);

                if (data.title !== undefined) chapter.title = data.title.trim();
                if (data.number !== undefined) chapter.number = normalizeChapterNumber(data.number);
                if (data.displayOrder !== undefined) chapter.displayOrder = data.displayOrder;
                if (data.description !== undefined) chapter.description = data.description.trim() || null;
                if (data.status !== undefined && data.status !== chapter.status) {
                    changeStatusInState(chapter, data.status, data.scheduledAt);
                } else if (data.scheduledAt !== undefined && chapter.status === 'scheduled') {
                    chapter.scheduledAt = data.scheduledAt;
                }
                touch(chapter);
                updated = { ...chapter };
            });

            return updated!;
        },

        async duplicate(chapterId) {
            await store.delay();
            let copy: AdminChapter | undefined;

            store.write(state => {
                const source = findOrThrow(state, chapterId);
                const siblings = activeOf(state, source.titleId);
                const nowIso = store.now().toISOString();

                copy = {
                    ...source,
                    id: store.newId('ch'),
                    number: nextFreeChapterNumber(siblings.map(c => c.number)),
                    displayOrder: siblings.length + 1,
                    status: 'draft',
                    publishedAt: null,
                    scheduledAt: null,
                    reads: 0,
                    completionRate: 0,
                    createdAt: nowIso,
                    updatedAt: nowIso,
                    createdBy: 'admin',
                    updatedBy: null,
                    deletedAt: null,
                };
                state.chapters.push(copy);

                const sourcePages = state.pages.filter(p => p.chapterId === chapterId);
                for (const page of sourcePages) {
                    state.pages.push({ ...page, id: store.newId('pg'), chapterId: copy.id, createdAt: nowIso, updatedAt: nowIso });
                }
                copy.pagesCount = sourcePages.length;
                copy.readyPagesCount = sourcePages.filter(p => p.processingStatus === 'ready').length;
            });

            return copy!;
        },

        async softDelete(chapterId) {
            await store.delay();
            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                chapter.deletedAt = store.now().toISOString();
                touch(chapter);
            });
        },

        async changeStatus(chapterId, status, opts) {
            await store.delay();
            let updated: AdminChapter | undefined;
            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                changeStatusInState(chapter, status, opts?.scheduledAt);
                updated = { ...chapter };
            });
            return updated!;
        },

        async reorderChapters(titleId, orderedIds) {
            await store.delay();
            store.write(state => {
                const current = activeOf(state, titleId).map(c => c.id);
                const error = validateReorder(current, orderedIds);
                if (error) throw new ChapterDomainError(error);

                orderedIds.forEach((id, index) => {
                    const chapter = state.chapters.find(c => c.id === id)!;
                    chapter.displayOrder = index + 1;
                    touch(chapter);
                });
            });
        },

        async bulkChangeStatus(ids, status) {
            await store.delay();
            // Um write só (uma serialização do store), com validação por item:
            // a falha de um capítulo não aborta o lote (resultado parcial).
            return store.write(state => {
                const result: BulkResult = { succeeded: [], failed: [] };
                for (const id of ids) {
                    try {
                        changeStatusInState(findOrThrow(state, id), status);
                        result.succeeded.push(id);
                    } catch (error) {
                        result.failed.push({ id, error: error instanceof ChapterDomainError ? error.violation : { code: 'chapter_not_found' } });
                    }
                }
                return result;
            });
        },

        async bulkDelete(ids) {
            await store.delay();
            return store.write(state => {
                const result: BulkResult = { succeeded: [], failed: [] };
                for (const id of ids) {
                    try {
                        const chapter = findOrThrow(state, id);
                        chapter.deletedAt = store.now().toISOString();
                        touch(chapter);
                        result.succeeded.push(id);
                    } catch (error) {
                        result.failed.push({ id, error: error instanceof ChapterDomainError ? error.violation : { code: 'chapter_not_found' } });
                    }
                }
                return result;
            });
        },

        async importLegacy() {
            throw new Error('Legacy import is available only through the HTTP API');
        },

        async listPages(chapterId) {
            await store.delay();
            const state = store.read();
            findOrThrow(state, chapterId);
            return state.pages.filter(p => p.chapterId === chapterId).sort((a, b) => a.order - b.order);
        },

        async addPages(chapterId, files: NewPageInput[]) {
            await store.delay();
            const created: ChapterPage[] = [];

            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                const existing = state.pages.filter(p => p.chapterId === chapterId);
                let order = existing.length;

                for (const file of files) {
                    order += 1;
                    const id = store.newId('pg');
                    const nowIso = store.now().toISOString();
                    created.push({
                        id,
                        chapterId,
                        order,
                        originalFilename: file.originalFilename,
                        processingStatus: 'uploading',
                        createdAt: nowIso,
                        updatedAt: nowIso,
                        ...store.buildFakeImage(id),
                    });
                }

                state.pages.push(...created);
                chapter.pagesCount = existing.length + created.length;
                touch(chapter);
            });

            created.forEach(page => store.schedulePageProcessing(page.id));
            return created;
        },

        async removePage(chapterId, pageId) {
            await store.delay();
            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                const index = state.pages.findIndex(p => p.id === pageId && p.chapterId === chapterId);
                if (index === -1) throw new ChapterDomainError({ code: 'chapter_not_found' });
                state.pages.splice(index, 1);
                renumberAndSyncCounters(state, chapter);
            });
        },

        async removePages(chapterId, pageIds) {
            await store.delay();
            // Um write só: remove todas, renumera e recalcula contadores UMA vez.
            return store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                const result: BulkResult = { succeeded: [], failed: [] };

                for (const pageId of pageIds) {
                    const index = state.pages.findIndex(p => p.id === pageId && p.chapterId === chapterId);
                    if (index === -1) result.failed.push({ id: pageId, error: { code: 'chapter_not_found' } });
                    else {
                        state.pages.splice(index, 1);
                        result.succeeded.push(pageId);
                    }
                }

                if (result.succeeded.length) renumberAndSyncCounters(state, chapter);
                return result;
            });
        },

        async replacePage(chapterId, pageId, file) {
            await store.delay();
            let replaced: ChapterPage | undefined;

            store.write(state => {
                const chapter = findOrThrow(state, chapterId);
                const page = state.pages.find(p => p.id === pageId && p.chapterId === chapterId);
                if (!page) throw new ChapterDomainError({ code: 'chapter_not_found' });

                const nowIso = store.now().toISOString();
                Object.assign(page, store.buildFakeImage(store.newId('img')), {
                    originalFilename: file.originalFilename,
                    processingStatus: 'uploading' as const,
                    updatedAt: nowIso,
                });
                chapter.readyPagesCount = state.pages.filter(p => p.chapterId === chapterId && p.processingStatus === 'ready').length;
                touch(chapter);
                replaced = { ...page };
            });

            store.schedulePageProcessing(pageId);
            return replaced!;
        },

        async reorderPages(chapterId, orderedIds) {
            await store.delay();
            let pages: ChapterPage[] = [];

            store.write(state => {
                findOrThrow(state, chapterId);
                const current = state.pages.filter(p => p.chapterId === chapterId).map(p => p.id);
                const error = validateReorder(current, orderedIds);
                if (error) throw new ChapterDomainError(error);

                const nowIso = store.now().toISOString();
                orderedIds.forEach((id, index) => {
                    const page = state.pages.find(p => p.id === id)!;
                    page.order = index + 1;
                    page.updatedAt = nowIso;
                });
                pages = state.pages.filter(p => p.chapterId === chapterId).sort((a, b) => a.order - b.order);
            });

            return pages;
        },

        async movePage(chapterId, pageId, toPosition) {
            await store.delay();
            // Uma leitura+escrita só (nada de listPages + reorderPages em série).
            return store.write(state => {
                findOrThrow(state, chapterId);
                const chapterPages = state.pages.filter(p => p.chapterId === chapterId).sort((a, b) => a.order - b.order);
                const from = chapterPages.findIndex(p => p.id === pageId);
                if (from === -1) throw new ChapterDomainError({ code: 'chapter_not_found' });

                const target = Math.max(0, Math.min(chapterPages.length - 1, toPosition - 1));
                chapterPages.splice(target, 0, ...chapterPages.splice(from, 1));

                const nowIso = store.now().toISOString();
                chapterPages.forEach((page, index) => {
                    page.order = index + 1;
                    page.updatedAt = nowIso;
                });
                return chapterPages;
            });
        },

        async retryPageProcessing(chapterId, pageId) {
            await store.delay();
            let page: ChapterPage | undefined;

            store.write(state => {
                findOrThrow(state, chapterId);
                const found = state.pages.find(p => p.id === pageId && p.chapterId === chapterId);
                if (!found) throw new ChapterDomainError({ code: 'chapter_not_found' });
                found.processingStatus = 'uploading';
                found.updatedAt = store.now().toISOString();
                page = { ...found };
            });

            store.schedulePageProcessing(pageId);
            return page!;
        },
    };
};
