import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { buildTitle, buildTitlePage } from '@/test/factories/titleFactory';

import useTitles from './useTitles';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTitles', () => {
    it('deve retornar array vazio e totalPages 0 enquanto carrega', () => {
        const { result } = renderHook(
            () => useTitles(QUERY_KEYS.TITLES),
            { wrapper },
        );

        expect(result.current.titles).toEqual([]);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.isLoading).toBe(true);
    });

    it('deve retornar titulos e metadados de paginacao', async () => {
        const titles = [buildTitle(), buildTitle(), buildTitle()];
        const page = buildTitlePage(titles);

        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json({ data: page, success: true }),
            ),
        );

        const { result } = renderHook(
            () => useTitles(QUERY_KEYS.TITLES),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.titles).toHaveLength(3);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.totalElements).toBe(3);
        expect(typeof result.current.refetchTitles).toBe('function');
    });

    it('deve retornar valores padrao quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(
            () => useTitles(QUERY_KEYS.TITLES),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.titles).toEqual([]);
        expect(result.current.totalPages).toBe(0);
    });
});
