import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';

import useBookmark from './useBookmark';

const buildSession = () => ({
    accessToken: 'token',
    refreshToken: 'refresh',
    userId: 'u1',
    name: 'User',
    email: 'u@e.com',
    role: 'MEMBER',
});

describe('useBookmark', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('deve iniciar com nenhum item salvo quando sem sessao', () => {
        const { result } = renderHook(() => useBookmark());

        expect(result.current.isSaved('title-1')).toBe(false);
    });

    it('deve carregar ids salvos quando sessao existe', async () => {
        localStorage.setItem(
            'manga-reader:auth-user',
            JSON.stringify(buildSession()),
        );

        server.use(
            http.get(`*${API_URLS.LIBRARY}`, () =>
                HttpResponse.json({
                    data: {
                        content: [
                            {
                                titleId: 'title-1',
                                name: 'A',
                                cover: '',
                                type: 'MANGA',
                                list: 'Lendo',
                                savedAt: '',
                            },
                        ],
                        page: 0,
                        size: 1000,
                        totalElements: 1,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-1')).toBe(true);
        });
    });

    it('deve adicionar bookmark via toggleBookmark', async () => {
        localStorage.setItem(
            'manga-reader:auth-user',
            JSON.stringify(buildSession()),
        );

        server.use(
            http.get(`*${API_URLS.LIBRARY}`, () =>
                HttpResponse.json({
                    data: {
                        content: [],
                        page: 0,
                        size: 1000,
                        totalElements: 0,
                        totalPages: 0,
                        last: true,
                    },
                    success: true,
                }),
            ),
            http.post(`*${API_URLS.LIBRARY}`, () =>
                HttpResponse.json({
                    data: {
                        titleId: 'title-2',
                        name: 'B',
                        cover: '',
                        type: 'MANGA',
                        list: 'Quero Ler',
                        savedAt: '',
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHook(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-2')).toBe(false);
        });

        await act(async () => {
            const added = await result.current.toggleBookmark({
                titleId: 'title-2',
                name: 'B',
                cover: '',
                type: 'MANGA',
            });
            expect(added).toBe(true);
        });

        expect(result.current.isSaved('title-2')).toBe(true);
    });

    it('deve remover bookmark via toggleBookmark', async () => {
        localStorage.setItem(
            'manga-reader:auth-user',
            JSON.stringify(buildSession()),
        );

        server.use(
            http.get(`*${API_URLS.LIBRARY}`, () =>
                HttpResponse.json({
                    data: {
                        content: [
                            {
                                titleId: 'title-1',
                                name: 'A',
                                cover: '',
                                type: 'MANGA',
                                list: 'Lendo',
                                savedAt: '',
                            },
                        ],
                        page: 0,
                        size: 1000,
                        totalElements: 1,
                        totalPages: 1,
                        last: true,
                    },
                    success: true,
                }),
            ),
            http.delete(
                `*${API_URLS.LIBRARY}/title-1`,
                () => new HttpResponse(null, { status: 204 }),
            ),
        );

        const { result } = renderHook(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-1')).toBe(true);
        });

        await act(async () => {
            const removed = await result.current.toggleBookmark({
                titleId: 'title-1',
                name: 'A',
                cover: '',
                type: 'MANGA',
            });
            expect(removed).toBe(false);
        });

        expect(result.current.isSaved('title-1')).toBe(false);
    });
});
