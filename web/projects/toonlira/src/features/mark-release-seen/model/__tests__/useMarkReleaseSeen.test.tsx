import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { ReleaseFeed } from '@entities/release';

import { useMarkReleaseSeen } from '../useMarkReleaseSeen';

const feed: ReleaseFeed = {
    releases: {
        content: [{
            chapterId: 'chapter-1',
            titleId: 'title-1',
            titleName: 'Berserk',
            chapterNumber: '370',
            publishedAt: '2026-07-25T14:00:00Z',
            contentLanguage: 'pt-BR',
            seen: false,
        }],
        page: 0,
        size: 30,
        totalElements: 1,
        totalPages: 1,
        last: true,
    },
    availableLanguages: ['pt-BR'],
};

describe('useMarkReleaseSeen', () => {
    it('optimistically marks a chapter and rolls back when the request fails', async () => {
        server.use(http.put(`*${API_URLS.RELEASES}/chapter-1/seen`, async () => {
            await delay(80);
            return new HttpResponse(null, { status: 500 });
        }));
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: Infinity },
                mutations: { retry: false },
            },
        });
        const key = [QUERY_KEYS.RELEASES, { period: 'WEEK' }];
        queryClient.setQueryData(key, feed);
        const wrapper = ({ children }: { children: ReactNode }) =>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        const { result } = renderHook(() => useMarkReleaseSeen('America/Sao_Paulo'), { wrapper });

        act(() => result.current.markChapter.mutate('chapter-1'));

        await waitFor(() => expect(
            queryClient.getQueryData<ReleaseFeed>(key)?.releases.content[0].seen,
        ).toBe(true));
        await waitFor(() => expect(result.current.markChapter.isError).toBe(true));
        expect(queryClient.getQueryData<ReleaseFeed>(key)?.releases.content[0].seen).toBe(false);
    });

    it('serializes chapter and day writes that share the release cache', async () => {
        const callOrder: string[] = [];
        server.use(
            http.put(`*${API_URLS.RELEASES}/chapter-1/seen`, async () => {
                callOrder.push('chapter:start');
                await delay(80);
                callOrder.push('chapter:end');
                return new HttpResponse(null, { status: 200 });
            }),
            http.put(`*${API_URLS.RELEASES}/days/2026-07-25/seen`, () => {
                callOrder.push('day');
                return HttpResponse.json({ success: true, data: { markedCount: 1 } });
            }),
        );
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
        const wrapper = ({ children }: { children: ReactNode }) =>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
        const { result } = renderHook(() => useMarkReleaseSeen('America/Sao_Paulo'), { wrapper });

        act(() => {
            result.current.markChapter.mutate('chapter-1');
            result.current.markDay.mutate('2026-07-25');
        });

        await waitFor(() => expect(result.current.markDay.isSuccess).toBe(true));
        expect(callOrder).toEqual(['chapter:start', 'chapter:end', 'day']);
    });
});
