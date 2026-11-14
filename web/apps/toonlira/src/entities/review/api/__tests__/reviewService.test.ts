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
    castReviewVote,
    removeReviewVote,
} from '../reviewService';

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
    textContent: 'Otimo manga',
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

describe('reviewService', () => {
    describe('getRatingsByTitleId', () => {
        it('deve retornar pagina de ratings mapeados', async () => {
            const ratings = [buildRatingResponse(), buildRatingResponse({ id: 'rating-2' })];

            server.use(
                http.get(`*${API_URLS.REVIEWS}/title/title-1`, () =>
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
            server.use(http.get(`*${API_URLS.REVIEWS}/title/title-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getRatingsByTitleId('title-1')).rejects.toThrow();
        });
    });

    describe('getRatingsAverage', () => {
        it('deve retornar media e contagem', async () => {
            server.use(
                http.get(`*${API_URLS.REVIEWS}/title/title-1/average`, () =>
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

            server.use(http.post(`*${API_URLS.REVIEWS}`, () => HttpResponse.json({ data: rating, success: true })));

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
                http.get(`*${API_URLS.REVIEWS}/user`, () =>
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
            const rating = buildRatingResponse({ textContent: 'Atualizado' });

            server.use(http.put(`*${API_URLS.REVIEWS}/rating-1`, () => HttpResponse.json({ data: rating, success: true })));

            const result = await updateReview({
                id: 'rating-1',
                comment: 'Atualizado',
            });

            expect(result.comment).toBe('Atualizado');
        });
    });

    describe('deleteReview', () => {
        it('deve deletar review sem erro', async () => {
            server.use(http.delete(`*${API_URLS.REVIEWS}/rating-1`, () => new HttpResponse(null, { status: 204 })));

            await expect(deleteReview('rating-1')).resolves.toBeUndefined();
        });

        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.delete(`*${API_URLS.REVIEWS}/rating-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(deleteReview('rating-1')).rejects.toThrow();
        });
    });

    describe('submitRating - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.post(`*${API_URLS.REVIEWS}`, () => HttpResponse.json(null, { status: 500 })));

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
            server.use(http.get(`*${API_URLS.REVIEWS}/user`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getUserReviews()).rejects.toThrow();
        });
    });

    describe('getRatingsAverage - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.get(`*${API_URLS.REVIEWS}/title/title-1/average`, () => HttpResponse.json(null, { status: 500 })));

            await expect(getRatingsAverage('title-1')).rejects.toThrow();
        });
    });

    describe('getRatingsByTitleId - campos avançados (DT-45)', () => {
        it('deve mapear reviewTitle, spoiler, top, upvotes, downvotes e myVote', async () => {
            const rating = buildRatingResponse({
                reviewTitle: 'Imperdível',
                spoiler: true,
                top: true,
                upvotes: 12,
                downvotes: 3,
                myVote: 'up',
            });

            server.use(http.get(`*${API_URLS.REVIEWS}/title/title-1`, () => HttpResponse.json({ data: buildPageResponse([rating]), success: true })));

            const result = await getRatingsByTitleId('title-1');

            expect(result.content[0]).toMatchObject({
                reviewTitle: 'Imperdível',
                spoiler: true,
                top: true,
                upvotes: 12,
                downvotes: 3,
                myVote: 'up',
            });
        });
    });

    describe('castReviewVote', () => {
        it('deve enviar value e retornar contadores + myVote', async () => {
            server.use(
                http.post(`*${API_URLS.REVIEWS}/rating-1/vote`, () => HttpResponse.json({ data: { upvotes: 8, downvotes: 1, myVote: 'up' }, success: true })),
            );

            const result = await castReviewVote('rating-1', 'up');

            expect(result).toEqual({ upvotes: 8, downvotes: 1, myVote: 'up' });
        });

        it('deve lançar erro quando API retorna 409 (voto próprio)', async () => {
            server.use(http.post(`*${API_URLS.REVIEWS}/rating-1/vote`, () => HttpResponse.json(null, { status: 409 })));

            await expect(castReviewVote('rating-1', 'down')).rejects.toThrow();
        });
    });

    describe('removeReviewVote', () => {
        it('deve remover voto e retornar contadores com myVote nulo', async () => {
            server.use(
                http.delete(`*${API_URLS.REVIEWS}/rating-1/vote`, () => HttpResponse.json({ data: { upvotes: 7, downvotes: 1, myVote: null }, success: true })),
            );

            const result = await removeReviewVote('rating-1');

            expect(result.upvotes).toBe(7);
            expect(result.myVote).toBeNull();
        });
    });

    describe('updateReview - erro', () => {
        it('deve lançar erro quando API retorna 500', async () => {
            server.use(http.put(`*${API_URLS.REVIEWS}/rating-1`, () => HttpResponse.json(null, { status: 500 })));

            await expect(updateReview({ id: 'rating-1', comment: 'Atualizado' })).rejects.toThrow();
        });
    });
});
