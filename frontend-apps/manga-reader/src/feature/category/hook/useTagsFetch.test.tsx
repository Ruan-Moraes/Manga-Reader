import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';

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
                    data: {
                        content: [
                            { value: 1, label: 'Action' },
                            { value: 2, label: 'Romance' },
                        ],
                        page: 0,
                        size: 1000,
                        totalElements: 2,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useTagsFetch(), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toHaveLength(2);
        expect(result.current.data![0].label).toBe('Action');
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.TAGS}`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useTagsFetch(), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
