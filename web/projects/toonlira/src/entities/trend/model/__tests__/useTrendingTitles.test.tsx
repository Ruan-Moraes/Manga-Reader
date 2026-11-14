import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { useTrendingDashboard, useTrendingTitles } from '../useTrendingTitles';

const item = {
    id: 'title-1', name: 'Berserk', genres: [], score: 10, growthPercent: 20,
    metrics: { reads: 1, libraryAdds: 2, reviews: 3, comments: 4, releases: 5 },
    growth: { reads: 1, libraryAdds: 2, reviews: 3, comments: 4, releases: 5 },
    calculatedAt: '2026-07-11T00:00:00Z',
};

describe('trending hooks', () => {
    it('caches title rankings by the complete query identity', async () => {
        server.use(http.get(`*${API_URLS.TRENDING}`, () => HttpResponse.json({ data: [item], success: true })));
        const queryClient = createTestQueryClient();
        const wrapper = ({ children }: { children: ReactNode }) =>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

        const { result } = renderHook(() => useTrendingTitles('DAY'), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(queryClient.getQueryData([QUERY_KEYS.TRENDING, 'DAY', 'SCORE', 30])).toEqual([item]);
    });

    it('reports a dashboard request failure', async () => {
        server.use(http.get(`*${API_URLS.TRENDING}`, () => new HttpResponse(null, { status: 500 })));
        const queryClient = createTestQueryClient();
        const wrapper = ({ children }: { children: ReactNode }) =>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

        const { result } = renderHook(() => useTrendingDashboard('MONTH'), { wrapper });
        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
