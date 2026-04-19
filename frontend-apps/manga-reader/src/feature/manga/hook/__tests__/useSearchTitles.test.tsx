import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';

import { server } from '@/test/mocks/server';
import { mockTitle } from '@/test/mocks/handlers';
import { renderHookWithProviders } from '@/test/testUtils';

import useSearchTitles from '../useSearchTitles';

describe('useSearchTitles', () => {
    it('deve retornar dados quando query não é vazia', async () => {
        const { result } = renderHookWithProviders(() =>
            useSearchTitles('One Piece'),
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data?.content).toHaveLength(1);
        expect(result.current.data?.content[0].name).toBe(mockTitle.name);
    });

    it('não deve fazer fetch com query vazia', () => {
        const { result } = renderHookWithProviders(() => useSearchTitles(''));

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
    });

    it('não deve fazer fetch com query contendo apenas espaços', () => {
        const { result } = renderHookWithProviders(() =>
            useSearchTitles('   '),
        );

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
    });

    it('deve retornar isLoading enquanto fetching', () => {
        const { result } = renderHookWithProviders(() =>
            useSearchTitles('Naruto'),
        );

        expect(result.current.isLoading).toBe(true);
    });

    it('deve retornar erro quando API falha', async () => {
        server.use(
            http.get('*/api/titles/search', () => {
                return HttpResponse.json(
                    { success: false, message: 'Internal error' },
                    { status: 500 },
                );
            }),
        );

        const { result } = renderHookWithProviders(() =>
            useSearchTitles('fail'),
        );

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
    });

    it('deve manter dados anteriores ao mudar página (placeholderData)', async () => {
        const { result, rerender } = renderHookWithProviders(
            ({ query, page }: { query: string; page: number }) =>
                useSearchTitles(query, page),
            { initialProps: { query: 'One Piece', page: 0 } },
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const firstPageData = result.current.data;

        rerender({ query: 'One Piece', page: 1 });

        // placeholderData mantém dados anteriores enquanto nova página carrega
        expect(result.current.data).toEqual(firstPageData);
    });
});
