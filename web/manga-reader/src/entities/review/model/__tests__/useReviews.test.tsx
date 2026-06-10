import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { renderHookWithProviders } from '@/test/testUtils';

import useReviews from '../useReviews';

const review = (id: string) => ({
    id,
    titleId: 't1',
    userName: 'User',
    overallRating: 4.5,
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    createdAt: '2026-01-01T00:00:00Z',
});

const pageBody = (content: unknown[], page: number, last: boolean) => ({
    data: { content, page, size: 10, totalElements: 3, totalPages: 2, last },
    success: true,
});

describe('useReviews', () => {
    it('carrega a primeira página e expõe hasNextPage', async () => {
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, ({ request }) => {
                const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
                return HttpResponse.json(page === 0 ? pageBody([review('r1'), review('r2')], 0, false) : pageBody([review('r3')], 1, true));
            }),
        );

        const { result } = renderHookWithProviders(() => useReviews('t1', { sort: 'top' }));

        await waitFor(() => expect(result.current.reviews).toHaveLength(2));
        expect(result.current.hasNextPage).toBe(true);
        expect(result.current.totalElements).toBe(3);
    });

    it('fetchNextPage acumula páginas (load-more)', async () => {
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, ({ request }) => {
                const page = Number(new URL(request.url).searchParams.get('page') ?? 0);
                return HttpResponse.json(page === 0 ? pageBody([review('r1'), review('r2')], 0, false) : pageBody([review('r3')], 1, true));
            }),
        );

        const { result } = renderHookWithProviders(() => useReviews('t1'));

        await waitFor(() => expect(result.current.reviews).toHaveLength(2));

        await result.current.fetchNextPage();

        await waitFor(() => expect(result.current.reviews).toHaveLength(3));
        expect(result.current.hasNextPage).toBe(false);
    });

    it('envia sort e star como parâmetros server-side', async () => {
        let capturedUrl = '';
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, ({ request }) => {
                capturedUrl = request.url;
                return HttpResponse.json(pageBody([], 0, true));
            }),
        );

        const { result } = renderHookWithProviders(() => useReviews('t1', { sort: 'recent', star: 5 }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        const params = new URL(capturedUrl).searchParams;
        expect(params.get('sort')).toBe('createdAt');
        expect(params.get('direction')).toBe('desc');
        expect(params.get('star')).toBe('5');
    });
});
