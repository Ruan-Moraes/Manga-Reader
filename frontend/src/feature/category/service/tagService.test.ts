import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import { getTags, getTagById } from './tagService';

const buildTag = (overrides = {}) => ({
    value: 1,
    label: 'Action',
    ...overrides,
});

describe('tagService', () => {
    describe('getTags', () => {
        it('deve retornar lista de tags', async () => {
            server.use(
                http.get(`*${API_URLS.TAGS}`, () =>
                    HttpResponse.json({
                        data: {
                            content: [
                                buildTag(),
                                buildTag({ value: 2, label: 'Romance' }),
                            ],
                            page: 0,
                            size: 1000,
                            totalElements: 2,
                            totalPages: 1,
                            last: true,
                        },
                        success: true,
                    }),
                ),
            );

            const result = await getTags();

            expect(result).toHaveLength(2);
            expect(result[0].label).toBe('Action');
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.get(`*${API_URLS.TAGS}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getTags()).rejects.toThrow();
        });
    });

    describe('getTagById', () => {
        it('deve retornar tag pelo id', async () => {
            server.use(
                http.get(`*${API_URLS.TAGS}/1`, () =>
                    HttpResponse.json({
                        data: buildTag(),
                        success: true,
                    }),
                ),
            );

            const result = await getTagById(1);

            expect(result.label).toBe('Action');
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.TAGS}/1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );
            await expect(getTagById(1)).rejects.toThrow();
        });
    });
});
