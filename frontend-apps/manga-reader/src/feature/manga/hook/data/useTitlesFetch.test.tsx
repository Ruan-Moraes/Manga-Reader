import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { buildTitlePage } from '@/test/factories/titleFactory';

import useTitlesFetch from './useTitlesFetch';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTitlesFetch', () => {
    it('deve iniciar em estado loading', () => {
        const { result } = renderHook(() => useTitlesFetch(QUERY_KEYS.TITLES), {
            wrapper,
        });

        expect(result.current.isLoading).toBe(true);
    });

    it('deve retornar dados quando busca e bem-sucedida', async () => {
        const page = buildTitlePage();

        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json({ data: page, success: true }),
            ),
        );

        const { result } = renderHook(() => useTitlesFetch(QUERY_KEYS.TITLES), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.content).toHaveLength(2);
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useTitlesFetch(QUERY_KEYS.TITLES), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
