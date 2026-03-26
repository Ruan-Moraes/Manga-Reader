import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import useTagsFetch from './useTagsFetch';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTagsFetch', () => {
    it('deve retornar tags quando busca e bem-sucedida', async () => {
        server.use(
            http.get(`*${API_URLS.TAGS}`, () =>
                HttpResponse.json({
                    data: [
                        { id: 1, name: 'Action' },
                        { id: 2, name: 'Romance' },
                    ],
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(
            () => useTagsFetch(QUERY_KEYS.TAGS),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const data = result.current.data as { id: number; name: string }[];
        expect(data).toHaveLength(2);
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.TAGS}`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(
            () => useTagsFetch(QUERY_KEYS.TAGS),
            { wrapper },
        );

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
