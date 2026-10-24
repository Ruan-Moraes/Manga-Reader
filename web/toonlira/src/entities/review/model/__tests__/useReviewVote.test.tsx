import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { renderHookWithProviders } from '@/test/testUtils';

import useReviews from '../useReviews';
import useReviewVote from '../useReviewVote';

const review = (overrides: Record<string, unknown> = {}) => ({
    id: 'r1',
    titleId: 't1',
    userName: 'User',
    overallRating: 4.5,
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    upvotes: 5,
    downvotes: 1,
    myVote: null,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

const listBody = (content: unknown[]) => ({
    data: { content, page: 0, size: 10, totalElements: content.length, totalPages: 1, last: true },
    success: true,
});

/** Renderiza lista + voto no mesmo QueryClient (cache compartilhado). */
const renderReviewsWithVote = () => renderHookWithProviders(() => ({ list: useReviews('t1'), vote: useReviewVote('t1') }));

describe('useReviewVote', () => {
    it('registra voto e reconcilia contadores com a resposta do servidor', async () => {
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, () => HttpResponse.json(listBody([review()]))),
            http.post(`*${API_URLS.REVIEWS}/r1/vote`, () => HttpResponse.json({ data: { upvotes: 6, downvotes: 1, myVote: 'up' }, success: true })),
        );

        const { result } = renderReviewsWithVote();
        await waitFor(() => expect(result.current.list.reviews).toHaveLength(1));

        result.current.vote.mutate({ id: 'r1', value: 'up', currentVote: null });

        await waitFor(() => expect(result.current.list.reviews[0].upvotes).toBe(6));
        expect(result.current.list.reviews[0].myVote).toBe('up');
    });

    it('toggle do mesmo lado remove o voto (DELETE)', async () => {
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, () => HttpResponse.json(listBody([review({ upvotes: 6, myVote: 'up' })]))),
            http.delete(`*${API_URLS.REVIEWS}/r1/vote`, () => HttpResponse.json({ data: { upvotes: 5, downvotes: 1, myVote: null }, success: true })),
        );

        const { result } = renderReviewsWithVote();
        await waitFor(() => expect(result.current.list.reviews).toHaveLength(1));

        result.current.vote.mutate({ id: 'r1', value: 'up', currentVote: 'up' });

        await waitFor(() => expect(result.current.list.reviews[0].myVote).toBeNull());
        expect(result.current.list.reviews[0].upvotes).toBe(5);
    });

    it('faz rollback do cache quando a requisição falha', async () => {
        server.use(
            http.get(`*${API_URLS.REVIEWS}/title/t1`, () => HttpResponse.json(listBody([review()]))),
            http.post(`*${API_URLS.REVIEWS}/r1/vote`, () => HttpResponse.json(null, { status: 500 })),
        );

        const { result } = renderReviewsWithVote();
        await waitFor(() => expect(result.current.list.reviews).toHaveLength(1));

        result.current.vote.mutate({ id: 'r1', value: 'up', currentVote: null });

        await waitFor(() => expect(result.current.vote.isError).toBe(true));
        expect(result.current.list.reviews[0].upvotes).toBe(5);
        expect(result.current.list.reviews[0].myVote).toBeNull();
    });
});
