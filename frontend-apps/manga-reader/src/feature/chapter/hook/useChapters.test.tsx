import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';

import { server } from '@/test/mocks/server';
import { renderHookWithProviders } from '@/test/testUtils';
import { API_URLS } from '@shared/constant/API_URLS';

import useChapters from './useChapters';

const page = (content: unknown[], overrides = {}) => ({
    data: {
        content,
        page: 0,
        size: 20,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        last: true,
        ...overrides,
    },
    success: true,
});

const chapter = (number: string) => ({
    number,
    title: `Cap ${number}`,
    releaseDate: '2025-01-01',
    pages: '20',
});

describe('useChapters', () => {
    it('retorna capítulos e metadados de paginação', async () => {
        server.use(
            http.get(`*${API_URLS.TITLES}/t1/chapters`, () =>
                HttpResponse.json(
                    page([chapter('1'), chapter('2')], {
                        totalElements: 5,
                        totalPages: 3,
                    }),
                ),
            ),
        );

        const { result } = renderHookWithProviders(() => useChapters('t1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.chapters).toHaveLength(2);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.totalElements).toBe(5);
    });

    it('envia page/size/direction ao serviço', async () => {
        const captured: Record<string, string | null> = {};

        server.use(
            http.get(`*${API_URLS.TITLES}/t1/chapters`, ({ request }) => {
                const url = new URL(request.url);
                captured.page = url.searchParams.get('page');
                captured.size = url.searchParams.get('size');
                captured.direction = url.searchParams.get('direction');
                return HttpResponse.json(page([]));
            }),
        );

        const { result } = renderHookWithProviders(() => useChapters('t1', { page: 2, size: 10, direction: 'desc' }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(captured).toEqual({
            page: '2',
            size: '10',
            direction: 'desc',
        });
    });

    it('não faz fetch sem titleId', () => {
        const { result } = renderHookWithProviders(() => useChapters(''));

        expect(result.current.chapters).toEqual([]);
        expect(result.current.totalPages).toBe(0);
    });

    it('mantém dados anteriores ao trocar de página (placeholderData)', async () => {
        server.use(
            http.get(`*${API_URLS.TITLES}/t1/chapters`, ({ request }) => {
                const p = new URL(request.url).searchParams.get('page');
                return HttpResponse.json(
                    page([chapter(p === '1' ? '21' : '1')], {
                        totalPages: 2,
                    }),
                );
            }),
        );

        const { result, rerender } = renderHookWithProviders(({ p }: { p: number }) => useChapters('t1', { page: p }), { initialProps: { p: 0 } });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const first = result.current.chapters;

        rerender({ p: 1 });

        expect(result.current.chapters).toEqual(first);
    });

    it('expõe isError quando API falha', async () => {
        server.use(http.get(`*${API_URLS.TITLES}/t1/chapters`, () => HttpResponse.json(null, { status: 500 })));

        const { result } = renderHookWithProviders(() => useChapters('t1'));

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
