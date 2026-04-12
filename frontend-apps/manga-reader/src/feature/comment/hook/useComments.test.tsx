import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';

import useComments from './useComments';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

const buildCommentResponse = (id = 'c1') => ({
    id,
    titleId: '1',
    parentCommentId: null,
    userId: 'u1',
    userName: 'User',
    userPhoto: 'photo.jpg',
    isHighlighted: false,
    wasEdited: false,
    createdAt: '2025-01-01T00:00:00Z',
    textContent: 'Teste',
    imageContent: null,
    likeCount: '0',
    dislikeCount: '0',
});

describe('useComments', () => {
    it('deve retornar array vazio enquanto carrega', () => {
        const { result } = renderHook(() => useComments('1'), { wrapper });

        expect(result.current.comments).toEqual([]);
        expect(result.current.totalPages).toBe(0);
        expect(result.current.isLoading).toBe(true);
    });

    it('deve retornar comentarios e metadados apos carregamento', async () => {
        server.use(
            http.get(`*${API_URLS.COMMENTS}/title/1`, () =>
                HttpResponse.json({
                    data: {
                        content: [
                            buildCommentResponse(),
                            buildCommentResponse('c2'),
                        ],
                        page: 0,
                        size: 20,
                        totalElements: 2,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useComments('1'), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.comments).toHaveLength(2);
        expect(result.current.totalPages).toBe(1);
        expect(result.current.totalElements).toBe(2);
        expect(typeof result.current.refetchComments).toBe('function');
    });

    it('deve retornar valores padrao quando API falha', async () => {
        server.use(
            http.get(`*${API_URLS.COMMENTS}/title/1`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useComments('1'), { wrapper });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.comments).toEqual([]);
        expect(result.current.totalPages).toBe(0);
    });
});
