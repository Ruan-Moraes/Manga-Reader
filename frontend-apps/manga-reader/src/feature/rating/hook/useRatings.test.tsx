import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useRatings from './useRatings';

const buildRatingResponse = (overrides = {}) => ({
    id: 'rating-1',
    titleId: 'title-1',
    userName: 'User',
    overallRating: 4.5,
    funRating: 5,
    artRating: 4,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    comment: 'Otimo',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
});

describe('useRatings', () => {
    it('deve carregar ratings e average ao montar', async () => {
        server.use(
            http.get(`*${API_URLS.RATINGS}/title/title-1`, () =>
                HttpResponse.json({
                    data: {
                        content: [buildRatingResponse()],
                        page: 0,
                        size: 20,
                        totalElements: 1,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
            http.get(`*${API_URLS.RATINGS}/title/title-1/average`, () =>
                HttpResponse.json({
                    data: { average: 4.5, count: 100 },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useRatings('title-1'));

        await waitFor(() => {
            expect(result.current.ratings).toHaveLength(1);
        });

        expect(result.current.average.average).toBe(4.5);
        expect(result.current.average.count).toBe(100);
    });

    it('deve retornar arrays/valores vazios quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.RATINGS}/title/bad-id`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
            http.get(`*${API_URLS.RATINGS}/title/bad-id/average`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useRatings('bad-id'));

        await waitFor(() => {
            // Espera o hook processar os catches
            expect(result.current.ratings).toEqual([]);
        });

        expect(result.current.average).toEqual({ average: 0, count: 0 });
    });
});
