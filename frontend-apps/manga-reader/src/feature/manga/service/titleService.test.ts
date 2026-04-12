import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { buildTitle, buildTitlePage } from '@/test/factories/titleFactory';

import {
    getTitles,
    getTitleById,
    searchTitles,
    getTitlesByGenre,
    filterTitles,
} from './titleService';

describe('titleService', () => {
    describe('getTitles', () => {
        it('deve retornar pagina de titulos', async () => {
            const titles = [buildTitle(), buildTitle()];
            const page = buildTitlePage(titles);

            server.use(
                http.get(`*${API_URLS.TITLES}`, () =>
                    HttpResponse.json({ data: page, success: true }),
                ),
            );

            const result = await getTitles();

            expect(result.content).toHaveLength(2);
            expect(result.page).toBe(0);
        });

        it('deve passar parametros de paginacao', async () => {
            const page = buildTitlePage([], 2);

            server.use(
                http.get(`*${API_URLS.TITLES}`, ({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('page')).toBe('2');
                    expect(url.searchParams.get('size')).toBe('10');
                    return HttpResponse.json({ data: page, success: true });
                }),
            );

            await getTitles(2, 10);
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getTitles()).rejects.toThrow();
        });
    });

    describe('getTitleById', () => {
        it('deve retornar titulo pelo id', async () => {
            const titulo = buildTitle({ id: 'abc-123', name: 'One Piece' });

            server.use(
                http.get(`*${API_URLS.TITLES}/abc-123`, () =>
                    HttpResponse.json({ data: titulo, success: true }),
                ),
            );

            const result = await getTitleById('abc-123');

            expect(result.id).toBe('abc-123');
            expect(result.name).toBe('One Piece');
        });

        it('deve lançar erro quando API retorna 500 no getTitleById', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES}/abc-123`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getTitleById('abc-123')).rejects.toThrow();
        });
    });

    describe('searchTitles', () => {
        it('deve buscar titulos por query', async () => {
            const page = buildTitlePage([buildTitle({ name: 'Naruto' })]);

            server.use(
                http.get(`*${API_URLS.TITLES_SEARCH}`, ({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('q')).toBe('naruto');
                    return HttpResponse.json({ data: page, success: true });
                }),
            );

            const result = await searchTitles('naruto');

            expect(result.content[0].name).toBe('Naruto');
        });

        it('deve lançar erro quando API retorna 500 no searchTitles', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES_SEARCH}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(searchTitles('naruto')).rejects.toThrow();
        });
    });

    describe('getTitlesByGenre', () => {
        it('deve buscar titulos por genero', async () => {
            const page = buildTitlePage([buildTitle()]);

            server.use(
                http.get(`*${API_URLS.TITLES_BY_GENRE}/action`, () =>
                    HttpResponse.json({ data: page, success: true }),
                ),
            );

            const result = await getTitlesByGenre('action');

            expect(result.content).toHaveLength(1);
        });

        it('deve lançar erro quando API retorna 500 no getTitlesByGenre', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES_BY_GENRE}/action`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getTitlesByGenre('action')).rejects.toThrow();
        });
    });

    describe('filterTitles', () => {
        it('deve filtrar titulos com parametros customizados', async () => {
            const page = buildTitlePage([buildTitle()]);

            server.use(
                http.get(`*${API_URLS.TITLES_FILTER}`, ({ request }) => {
                    const url = new URL(request.url);
                    expect(url.searchParams.get('status')).toBe('ONGOING');
                    return HttpResponse.json({ data: page, success: true });
                }),
            );

            const result = await filterTitles({ status: 'ONGOING' });

            expect(result.content).toHaveLength(1);
        });

        it('deve lançar erro quando API retorna 500 no filterTitles', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES_FILTER}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(filterTitles({ status: 'ONGOING' })).rejects.toThrow();
        });
    });
});
