import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getUserLibrary,
    saveToLibrary,
    updateSavedMangaList,
    removeSavedManga,
    getUserLibraryByList,
    getLibraryCounts,
} from './libraryService';

const buildSavedItem = (overrides = {}) => ({
    titleId: 'title-1',
    name: 'One Piece',
    cover: '/covers/op.jpg',
    type: 'MANGA',
    list: 'Lendo' as const,
    savedAt: '2025-01-01T00:00:00Z',
    ...overrides,
});

const buildPageResponse = (content: unknown[] = []) => ({
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
});

describe('libraryService', () => {
    describe('getUserLibrary', () => {
        it('deve retornar pagina de itens da biblioteca', async () => {
            server.use(
                http.get(`*${API_URLS.LIBRARY}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildSavedItem()]),
                        success: true,
                    }),
                ),
            );

            const result = await getUserLibrary();

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('One Piece');
        });
    });

    describe('saveToLibrary', () => {
        it('deve salvar titulo na biblioteca', async () => {
            const item = buildSavedItem();

            server.use(
                http.post(`*${API_URLS.LIBRARY}`, () =>
                    HttpResponse.json({ data: item, success: true }),
                ),
            );

            const result = await saveToLibrary({ titleId: 'title-1' });

            expect(result.titleId).toBe('title-1');
        });
    });

    describe('updateSavedMangaList', () => {
        it('deve atualizar lista sem erro', async () => {
            server.use(
                http.patch(`*${API_URLS.LIBRARY}/title-1`, () =>
                    new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(
                updateSavedMangaList({ titleId: 'title-1', list: 'Concluído' }),
            ).resolves.toBeUndefined();
        });
    });

    describe('removeSavedManga', () => {
        it('deve remover titulo da biblioteca sem erro', async () => {
            server.use(
                http.delete(`*${API_URLS.LIBRARY}/title-1`, () =>
                    new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(removeSavedManga('title-1')).resolves.toBeUndefined();
        });
    });

    describe('getUserLibraryByList', () => {
        it('deve filtrar por lista especifica', async () => {
            server.use(
                http.get(`*${API_URLS.LIBRARY}`, ({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('list')).toBe('Lendo');
                    return HttpResponse.json({
                        data: buildPageResponse([buildSavedItem()]),
                        success: true,
                    });
                }),
            );

            const result = await getUserLibraryByList('Lendo');

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getLibraryCounts', () => {
        it('deve retornar contagens por lista', async () => {
            server.use(
                http.get(`*${API_URLS.LIBRARY}/counts`, () =>
                    HttpResponse.json({
                        data: { lendo: 5, queroLer: 10, concluido: 3, total: 18 },
                        success: true,
                    }),
                ),
            );

            const result = await getLibraryCounts();

            expect(result.total).toBe(18);
            expect(result.lendo).toBe(5);
        });
    });
});
