import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { renderHookWithProviders, seedAuthSession } from '@/test/testUtils';

import useSubmitReview from '../useSubmitReview';

const ratingResponse = {
    id: 'r-new',
    titleId: 't1',
    userName: 'User',
    overallRating: 4.5,
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    reviewTitle: 'Imperdível',
    spoiler: true,
    createdAt: '2026-01-01T00:00:00Z',
};

const input = {
    funRating: 4,
    artRating: 5,
    storylineRating: 5,
    charactersRating: 4,
    originalityRating: 4,
    pacingRating: 5,
    reviewTitle: 'Imperdível',
    spoiler: true,
};

describe('useSubmitReview', () => {
    beforeEach(() => localStorage.clear());

    it('submete a resenha (com reviewTitle/spoiler) quando autenticado', async () => {
        seedAuthSession();

        let body: Record<string, unknown> = {};
        server.use(
            http.post(`*${API_URLS.RATINGS}`, async ({ request }) => {
                body = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({ data: ratingResponse, success: true });
            }),
        );

        const { result } = renderHookWithProviders(() => useSubmitReview('t1'));

        result.current.mutate(input);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(body.titleId).toBe('t1');
        expect(body.reviewTitle).toBe('Imperdível');
        expect(body.spoiler).toBe(true);
    });

    it('rejeita sem autenticação (não chama a API)', async () => {
        const { result } = renderHookWithProviders(() => useSubmitReview('t1'));

        result.current.mutate(input);

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
