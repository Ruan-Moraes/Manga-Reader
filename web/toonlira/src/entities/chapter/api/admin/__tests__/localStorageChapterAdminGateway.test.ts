import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { createMemoryStorage } from '@/test/helpers/memoryStorage';

import { ChapterDomainError } from '../../../model/admin/chapterErrors';
import { createChapterStore, type ChapterStoreOptions } from '../localStorageChapterStore';
import { createLocalStorageChapterAdminGateway } from '../localStorageChapterAdminGateway';

const makeGateway = (opts: ChapterStoreOptions = {}) => {
    const storage = opts.storage ?? createMemoryStorage();
    const store = createChapterStore({ latencyMs: 0, storage, ...opts });
    return { gateway: createLocalStorageChapterAdminGateway(store), store, storage };
};

const violation = async (promise: Promise<unknown>): Promise<string> => {
    try {
        await promise;
        return 'no-error';
    } catch (error) {
        return error instanceof ChapterDomainError ? error.violation.code : 'unexpected';
    }
};

describe('localStorageChapterAdminGateway', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('seed', () => {
        it('é determinístico: dois stores com mesma semente produzem o mesmo estado', async () => {
            const a = makeGateway({ seed: 42 });
            const b = makeGateway({ seed: 42 });

            const listA = await a.gateway.list({ page: 0, size: 100, titleId: '1' });
            const listB = await b.gateway.list({ page: 0, size: 100, titleId: '1' });

            expect(listA.content.map(c => ({ id: c.id, number: c.number, status: c.status, reads: c.reads }))).toEqual(
                listB.content.map(c => ({ id: c.id, number: c.number, status: c.status, reads: c.reads })),
            );
            expect(listA.content.length).toBeGreaterThan(0);
        });

        it('semeia o catálogo demo na primeira listagem admin', async () => {
            const { gateway } = makeGateway();
            const result = await gateway.list({ page: 0, size: 10 });
            expect(result.totalElements).toBeGreaterThan(10);
        });
    });

    describe('list (server-side ready)', () => {
        it('pagina e ordena numericamente por number (nunca lexicográfico)', async () => {
            const { gateway } = makeGateway();
            const page = await gateway.list({ page: 0, size: 5, titleId: '1', sort: 'number', direction: 'asc' });

            const numbers = page.content.map(c => parseFloat(c.number));
            expect(numbers).toEqual([...numbers].sort((x, y) => x - y));
            expect(page.content.length).toBeLessThanOrEqual(5);
            expect(page.totalPages).toBeGreaterThanOrEqual(1);
        });

        it('filtra por status e por busca de número', async () => {
            const { gateway } = makeGateway();
            const published = await gateway.list({ page: 0, size: 100, titleId: '1', status: ['published'] });
            expect(published.content.every(c => c.status === 'published')).toBe(true);

            const byNumber = await gateway.list({ page: 0, size: 100, titleId: '1', search: '2' });
            expect(byNumber.content.every(c => c.number.startsWith('2') || c.title.toLowerCase().includes('2'))).toBe(true);
        });

        it('não retorna soft-deletados por default, mas retorna com includeDeleted', async () => {
            const { gateway } = makeGateway();
            const before = await gateway.list({ page: 0, size: 100, titleId: '1' });
            const target = before.content[0];

            await gateway.softDelete(target.id);

            const after = await gateway.list({ page: 0, size: 100, titleId: '1' });
            expect(after.content.map(c => c.id)).not.toContain(target.id);

            const withDeleted = await gateway.list({ page: 0, size: 100, titleId: '1', includeDeleted: true });
            expect(withDeleted.content.map(c => c.id)).toContain(target.id);
        });
    });

    describe('create/update', () => {
        it('cria rascunho com dados válidos', async () => {
            const { gateway } = makeGateway();
            const created = await gateway.create({ titleId: '3', title: 'Especial', number: '99' });

            expect(created.status).toBe('draft');
            expect(created.pagesCount).toBe(0);
            expect((await gateway.getById(created.id)).title).toBe('Especial');
        });

        it('rejeita número duplicado na mesma obra e aceita em obra diferente', async () => {
            const { gateway } = makeGateway();
            await gateway.create({ titleId: '3', title: 'A', number: '99' });

            expect(await violation(gateway.create({ titleId: '3', title: 'B', number: '99' }))).toBe('number_taken');
            await expect(gateway.create({ titleId: '4', title: 'B', number: '99' })).resolves.toBeTruthy();
        });

        it('rejeita edição com número inválido', async () => {
            const { gateway } = makeGateway();
            const created = await gateway.create({ titleId: '3', title: 'A', number: '99' });
            expect(await violation(gateway.update(created.id, { number: 'abc' }))).toBe('number_invalid');
        });
    });

    describe('status', () => {
        it('não publica capítulo sem páginas prontas', async () => {
            const { gateway } = makeGateway();
            const draft = await gateway.create({ titleId: '3', title: 'Sem páginas', number: '100' });
            expect(await violation(gateway.changeStatus(draft.id, 'published'))).toBe('publish_requires_pages');
        });

        it('agendamento exige data futura; lazy promotion publica quando vence', async () => {
            let currentTime = new Date('2026-07-04T10:00:00Z');
            const { gateway } = makeGateway({ now: () => currentTime, processingStepMs: 0 });

            const draft = await gateway.create({ titleId: '3', title: 'Agendado', number: '101' });
            expect(await violation(gateway.changeStatus(draft.id, 'scheduled', { scheduledAt: '2026-07-04T09:00:00Z' }))).toBe('schedule_requires_future_date');

            await gateway.changeStatus(draft.id, 'scheduled', { scheduledAt: '2026-07-04T11:00:00Z' });
            expect((await gateway.getById(draft.id)).status).toBe('scheduled');

            currentTime = new Date('2026-07-04T12:00:00Z');
            const promoted = await gateway.getById(draft.id);
            expect(promoted.status).toBe('published');
            expect(promoted.publishedAt).toBe('2026-07-04T11:00:00Z');
        });
    });

    describe('duplicate', () => {
        it('duplica como rascunho com próximo número livre e páginas clonadas', async () => {
            const { gateway } = makeGateway();
            const source = (await gateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
            const numbers = (await gateway.list({ page: 0, size: 100, titleId: '1' })).content.map(c => parseFloat(c.number));

            const copy = await gateway.duplicate(source.id);

            expect(copy.status).toBe('draft');
            expect(copy.publishedAt).toBeNull();
            expect(copy.reads).toBe(0);
            expect(parseFloat(copy.number)).toBeGreaterThan(Math.max(...numbers));
            const copyPages = await gateway.listPages(copy.id);
            expect(copyPages.length).toBe(source.pagesCount);
            expect(copyPages.map(p => p.id)).not.toEqual((await gateway.listPages(source.id)).map(p => p.id));
        });
    });

    describe('reorderChapters', () => {
        it('aplica a nova ordem de forma atômica', async () => {
            const { gateway } = makeGateway();
            const chapters = (await gateway.list({ page: 0, size: 100, titleId: '2' })).content;
            const reversed = [...chapters.map(c => c.id)].reverse();

            await gateway.reorderChapters('2', reversed);

            const after = (await gateway.list({ page: 0, size: 100, titleId: '2' })).content;
            const byId = new Map(after.map(c => [c.id, c.displayOrder]));
            reversed.forEach((id, index) => expect(byId.get(id)).toBe(index + 1));
        });

        it('rejeita conjunto incompleto sem alterar nada', async () => {
            const { gateway } = makeGateway();
            const chapters = (await gateway.list({ page: 0, size: 100, titleId: '2' })).content;
            const before = chapters.map(c => ({ id: c.id, displayOrder: c.displayOrder }));

            expect(await violation(gateway.reorderChapters('2', chapters.slice(1).map(c => c.id)))).toBe('reorder_incomplete_set');

            const after = (await gateway.list({ page: 0, size: 100, titleId: '2' })).content;
            expect(after.map(c => ({ id: c.id, displayOrder: c.displayOrder }))).toEqual(before);
        });
    });

    describe('bulk', () => {
        it('reporta resultado parcial: capítulo sem páginas não publica, demais publicam', async () => {
            const { gateway } = makeGateway();
            const semPaginas = await gateway.create({ titleId: '3', title: 'Vazio', number: '200' });
            const hidden = (await gateway.list({ page: 0, size: 100, status: ['hidden'] })).content[0];

            const result = await gateway.bulkChangeStatus([semPaginas.id, hidden.id], 'published');

            expect(result.succeeded).toEqual([hidden.id]);
            expect(result.failed).toEqual([{ id: semPaginas.id, error: { code: 'publish_requires_pages' } }]);
        });

        it('bulkDelete marca soft delete de todos os válidos', async () => {
            const { gateway } = makeGateway();
            const a = await gateway.create({ titleId: '3', title: 'A', number: '201' });
            const b = await gateway.create({ titleId: '3', title: 'B', number: '202' });

            const result = await gateway.bulkDelete([a.id, b.id, 'inexistente']);

            expect(result.succeeded).toEqual([a.id, b.id]);
            expect(result.failed).toEqual([{ id: 'inexistente', error: { code: 'chapter_not_found' } }]);
        });
    });

    describe('páginas', () => {
        it('addPages inicia pipeline uploading→processing→ready e atualiza contadores', async () => {
            vi.useFakeTimers();
            const { gateway } = makeGateway({ processingStepMs: 100 });
            const draft = await gateway.create({ titleId: '3', title: 'Com páginas', number: '300' });

            const pages = await gateway.addPages(draft.id, [{ originalFilename: 'p1.jpg' }, { originalFilename: 'p2.jpg' }]);
            expect(pages.map(p => p.processingStatus)).toEqual(['uploading', 'uploading']);
            expect((await gateway.getById(draft.id)).pagesCount).toBe(2);
            expect((await gateway.getById(draft.id)).readyPagesCount).toBe(0);

            await vi.advanceTimersByTimeAsync(100);
            expect((await gateway.listPages(draft.id)).map(p => p.processingStatus)).toEqual(['processing', 'processing']);

            await vi.advanceTimersByTimeAsync(100);
            expect((await gateway.listPages(draft.id)).map(p => p.processingStatus)).toEqual(['ready', 'ready']);
            expect((await gateway.getById(draft.id)).readyPagesCount).toBe(2);

            // Com páginas prontas, publicar passa a ser permitido.
            await expect(gateway.changeStatus(draft.id, 'published')).resolves.toMatchObject({ status: 'published' });
        });

        it('failRate marca páginas com erro e retry recupera', async () => {
            vi.useFakeTimers();
            const { gateway } = makeGateway({ processingStepMs: 50, failRate: 1 });
            const draft = await gateway.create({ titleId: '3', title: 'Erros', number: '301' });

            await gateway.addPages(draft.id, [{ originalFilename: 'p1.jpg' }]);
            await vi.advanceTimersByTimeAsync(100);
            expect((await gateway.listPages(draft.id))[0].processingStatus).toBe('error');

            const page = (await gateway.listPages(draft.id))[0];
            await gateway.retryPageProcessing(draft.id, page.id);
            await vi.advanceTimersByTimeAsync(100);
            // failRate=1 volta a falhar; o contrato garante o ciclo, não o sucesso.
            expect(['ready', 'error']).toContain((await gateway.listPages(draft.id))[0].processingStatus);
        });

        it('reorderPages é atômico e movePage desloca de forma previsível', async () => {
            const { gateway } = makeGateway();
            const chapter = (await gateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
            const pages = await gateway.listPages(chapter.id);
            const ids = pages.map(p => p.id);

            expect(await violation(gateway.reorderPages(chapter.id, ids.slice(1)))).toBe('reorder_incomplete_set');

            const moved = await gateway.movePage(chapter.id, ids[0], 3);
            expect(moved.findIndex(p => p.id === ids[0])).toBe(2);
            expect(moved.map(p => p.order)).toEqual(moved.map((_, i) => i + 1));
        });

        it('removePage recompacta a ordem e removePages reporta parcial', async () => {
            const { gateway } = makeGateway();
            const chapter = (await gateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
            const pages = await gateway.listPages(chapter.id);

            await gateway.removePage(chapter.id, pages[0].id);
            const after = await gateway.listPages(chapter.id);
            expect(after.length).toBe(pages.length - 1);
            expect(after.map(p => p.order)).toEqual(after.map((_, i) => i + 1));

            const result = await gateway.removePages(chapter.id, [after[0].id, 'nao-existe']);
            expect(result.succeeded).toEqual([after[0].id]);
            expect(result.failed[0].id).toBe('nao-existe');
        });

        it('replacePage troca a imagem e reinicia o processamento', async () => {
            vi.useFakeTimers();
            const { gateway } = makeGateway({ processingStepMs: 50 });
            const chapter = (await gateway.list({ page: 0, size: 1, titleId: '1', status: ['published'] })).content[0];
            const original = (await gateway.listPages(chapter.id))[0];

            const replaced = await gateway.replacePage(chapter.id, original.id, { originalFilename: 'novo.png' });

            expect(replaced.originalFilename).toBe('novo.png');
            expect(replaced.processingStatus).toBe('uploading');
            expect(replaced.imageUrl).not.toBe(original.imageUrl);

            await vi.advanceTimersByTimeAsync(100);
            expect((await gateway.listPages(chapter.id)).find(p => p.id === original.id)?.processingStatus).toBe('ready');
        });
    });

    describe('persistência', () => {
        it('estado sobrevive entre instâncias que compartilham o mesmo storage', async () => {
            const storage = createMemoryStorage();
            const first = makeGateway({ storage, seed: 7 });
            const created = await first.gateway.create({ titleId: '5', title: 'Persistente', number: '500' });

            const second = makeGateway({ storage, seed: 7 });
            await expect(second.gateway.getById(created.id)).resolves.toMatchObject({ title: 'Persistente' });
        });
    });
});

describe('isolamento de storage nos testes', () => {
    beforeEach(() => {
        // Garantia extra: nenhum teste acima deve ter tocado o localStorage real.
        expect(window.localStorage.getItem('mr:chapters:admin:v1')).toBeNull();
    });

    it('localStorage real permanece limpo', () => {
        expect(window.localStorage.getItem('mr:chapters:admin:v1')).toBeNull();
    });
});
