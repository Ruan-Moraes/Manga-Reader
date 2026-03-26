import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getChaptersByTitleId, getChapterByNumber } from './chapterService';

const buildChapter = (overrides = {}) => ({
    number: '1',
    title: 'Capitulo 1',
    releaseDate: '2025-01-01',
    pages: '20',
    ...overrides,
});

describe('chapterService', () => {
    describe('getChaptersByTitleId', () => {
        it('deve retornar pagina de capitulos', async () => {
            const chapters = [buildChapter(), buildChapter({ number: '2', title: 'Capitulo 2' })];

            server.use(
                http.get(`*${API_URLS.CHAPTERS}/title/title-1`, () =>
                    HttpResponse.json({
                        data: {
                            content: chapters,
                            page: 0,
                            size: 50,
                            totalElements: 2,
                            totalPages: 1,
                            last: true,
                        },
                        success: true,
                    }),
                ),
            );

            const result = await getChaptersByTitleId('title-1');

            expect(result.content).toHaveLength(2);
            expect(result.content[0].number).toBe('1');
        });

        it('deve passar parametros de paginacao', async () => {
            server.use(
                http.get(`*${API_URLS.CHAPTERS}/title/title-1`, ({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('page')).toBe('1');
                    expect(url.searchParams.get('size')).toBe('25');
                    return HttpResponse.json({
                        data: {
                            content: [],
                            page: 1,
                            size: 25,
                            totalElements: 0,
                            totalPages: 0,
                            last: true,
                        },
                        success: true,
                    });
                }),
            );

            await getChaptersByTitleId('title-1', 1, 25);
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.get(`*${API_URLS.CHAPTERS}/title/title-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getChaptersByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('getChapterByNumber', () => {
        it('deve retornar capitulo pelo numero', async () => {
            const chapter = buildChapter({ number: '5', title: 'Capitulo 5' });

            server.use(
                http.get(`*${API_URLS.CHAPTERS}/title/title-1/5`, () =>
                    HttpResponse.json({ data: chapter, success: true }),
                ),
            );

            const result = await getChapterByNumber('title-1', '5');

            expect(result.number).toBe('5');
            expect(result.title).toBe('Capitulo 5');
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.CHAPTERS}/title/title-1/5`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getChapterByNumber('title-1', '5')).rejects.toThrow();
        });
    });
});
