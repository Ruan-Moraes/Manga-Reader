import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import {
    getRatingsByTitleId,
    getRatingsAverage,
    submitRating,
    getUserReviews,
    updateReview,
    deleteReview,
} from './ratingService';

const buildRatingResponse = (overrides = {}) => ({
    id: 'rating-1',
    titleId: 'title-1',
    titleName: 'One Piece',
    userName: 'Test User',
    overallRating: 4.5,
    funRating: 5,
    artRating: 4,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    comment: 'Otimo manga',
    createdAt: '2025-01-01T00:00:00Z',
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

describe('ratingService', () => {
    describe('getRatingsByTitleId', () => {
        it('deve retornar pagina de ratings mapeados', async () => {
            const ratings = [
                buildRatingResponse(),
                buildRatingResponse({ id: 'rating-2' }),
            ];

            server.use(
                http.get(`*${API_URLS.RATINGS}/title/title-1`, () =>
                    HttpResponse.json({
                        data: buildPageResponse(ratings),
                        success: true,
                    }),
                ),
            );

            const result = await getRatingsByTitleId('title-1');

            expect(result.content).toHaveLength(2);
            expect(result.content[0].overallRating).toBe(4.5);
        });

        it('deve propagar erro quando API falha', async () => {
            server.use(
                http.get(`*${API_URLS.RATINGS}/title/title-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getRatingsByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('getRatingsAverage', () => {
        it('deve retornar media e contagem', async () => {
            server.use(
                http.get(`*${API_URLS.RATINGS}/title/title-1/average`, () =>
                    HttpResponse.json({
                        data: { average: 4.2, count: 150 },
                        success: true,
                    }),
                ),
            );

            const result = await getRatingsAverage('title-1');

            expect(result.average).toBe(4.2);
            expect(result.count).toBe(150);
        });
    });

    describe('submitRating', () => {
        it('deve enviar rating e retornar dados mapeados', async () => {
            const rating = buildRatingResponse();

            server.use(
                http.post(`*${API_URLS.RATINGS}`, () =>
                    HttpResponse.json({ data: rating, success: true }),
                ),
            );

            const result = await submitRating({
                titleId: 'title-1',
                funRating: 5,
                artRating: 4,
                storylineRating: 5,
                charactersRating: 4,
                originalityRating: 4,
                pacingRating: 5,
            });

            expect(result.id).toBe('rating-1');
            expect(result.overallRating).toBe(4.5);
        });
    });

    describe('getUserReviews', () => {
        it('deve retornar pagina de reviews do usuario', async () => {
            const ratings = [buildRatingResponse()];

            server.use(
                http.get(`*${API_URLS.RATINGS}/user`, () =>
                    HttpResponse.json({
                        data: buildPageResponse(ratings),
                        success: true,
                    }),
                ),
            );

            const result = await getUserReviews();

            expect(result.content).toHaveLength(1);
        });
    });

    describe('updateReview', () => {
        it('deve atualizar review e retornar dados mapeados', async () => {
            const rating = buildRatingResponse({ comment: 'Atualizado' });

            server.use(
                http.put(`*${API_URLS.RATINGS}/rating-1`, () =>
                    HttpResponse.json({ data: rating, success: true }),
                ),
            );

            const result = await updateReview({
                id: 'rating-1',
                comment: 'Atualizado',
            });

            expect(result.comment).toBe('Atualizado');
        });
    });

    describe('deleteReview', () => {
        it('deve deletar review sem erro', async () => {
            server.use(
                http.delete(
                    `*${API_URLS.RATINGS}/rating-1`,
                    () => new HttpResponse(null, { status: 204 }),
                ),
            );

            await expect(deleteReview('rating-1')).resolves.toBeUndefined();
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.delete(`*${API_URLS.RATINGS}/rating-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(deleteReview('rating-1')).rejects.toThrow();
        });
    });

    describe('submitRating - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.post(`*${API_URLS.RATINGS}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(
                submitRating({
                    titleId: 'title-1',
                    funRating: 5,
                    artRating: 4,
                    storylineRating: 5,
                    charactersRating: 4,
                    originalityRating: 4,
                    pacingRating: 5,
                }),
            ).rejects.toThrow();
        });
    });

    describe('getUserReviews - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.RATINGS}/user`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getUserReviews()).rejects.toThrow();
        });
    });

    describe('getRatingsAverage - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.get(`*${API_URLS.RATINGS}/title/title-1/average`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getRatingsAverage('title-1')).rejects.toThrow();
        });
    });

    describe('updateReview - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(
                http.put(`*${API_URLS.RATINGS}/rating-1`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(
                updateReview({ id: 'rating-1', comment: 'Atualizado' }),
            ).rejects.toThrow();
        });
    });
});
