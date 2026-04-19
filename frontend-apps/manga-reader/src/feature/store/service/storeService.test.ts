import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getStores, getStoresByTitleId } from './storeService';

const buildStore = (overrides = {}) => ({
    id: 'store-1',
    name: 'Amazon',
    url: 'https://amazon.com',
    logo: 'amazon.jpg',
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

describe('storeService', () => {
    describe('getStores', () => {
        it('deve retornar pagina de lojas', async () => {
            server.use(
                http.get(`*${API_URLS.STORES}`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildStore()]),
                        success: true,
                    }),
                ),
            );

            const result = await getStores();

            expect(result.content).toHaveLength(1);
            expect(result.content[0].name).toBe('Amazon');
        });
    });

    describe('getStoresByTitleId', () => {
        it('deve retornar lojas por titulo', async () => {
            server.use(
                http.get(`*${API_URLS.STORES}/title/title-1`, () =>
                    HttpResponse.json({
                        data: buildPageResponse([buildStore()]),
                        success: true,
                    }),
                ),
            );

            const result = await getStoresByTitleId('title-1');

            expect(result.content).toHaveLength(1);
        });
    });

    describe('getStores — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.STORES}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getStores()).rejects.toThrow();
        });
    });

    describe('getStoresByTitleId — erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.STORES}/title/title-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getStoresByTitleId('title-1')).rejects.toThrow();
        });
    });
});
