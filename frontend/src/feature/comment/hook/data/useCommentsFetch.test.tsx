import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';

import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';

import useCommentsFetch from './useCommentsFetch';

const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

const buildCommentResponse = (id = 'c1') => ({
    id,
    titleId: 'title-1',
    parentCommentId: null,
    userId: 'user-1',
    userName: 'User',
    userPhoto: 'photo.jpg',
    isHighlighted: false,
    wasEdited: false,
    createdAt: '2025-01-01T00:00:00Z',
    textContent: 'Comentario',
    imageContent: null,
    likeCount: '5',
    dislikeCount: '0',
});

describe('useCommentsFetch', () => {
    it('deve retornar comentarios quando busca e bem-sucedida', async () => {
        server.use(
            http.get(`*${API_URLS.COMMENTS}/title/1`, () =>
                HttpResponse.json({
                    data: {
                        content: [buildCommentResponse()],
                        page: 0,
                        size: 20,
                        totalElements: 1,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useCommentsFetch('1'), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.content).toHaveLength(1);
        expect(result.current.data?.content[0].user.name).toBe('User');
    });

    it('deve retornar erro quando id e invalido', async () => {
        const { result } = renderHook(() => useCommentsFetch('abc'), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
