import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { buildTitle } from '@/test/factories/titleFactory';

import useTitle from './useTitle';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTitle', () => {
    it('deve expor title, isLoading e refetchTitle', async () => {
        const titulo = buildTitle({ id: '1', name: 'Naruto' });

        server.use(
            http.get(`*${API_URLS.TITLES}/1`, () =>
                HttpResponse.json({ data: titulo, success: true }),
            ),
        );

        const { result } = renderHook(() => useTitle('1'), { wrapper });

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.title).toEqual(titulo);
        expect(result.current.isError).toBe(false);
        expect(typeof result.current.refetchTitle).toBe('function');
    });

    it('deve expor isError quando busca falha', async () => {
        const { result } = renderHook(() => useTitle('abc'), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.title).toBeUndefined();
    });
});
