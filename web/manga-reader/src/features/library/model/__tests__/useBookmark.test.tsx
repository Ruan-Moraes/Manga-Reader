import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '@/test/mocks/server';
import { renderHookWithProviders, seedAuthSession } from '@/test/testUtils';

import useBookmark from '../useBookmark';

const bookmarkPayload = {
    titleId: 'title-1',
    name: 'One Piece',
    cover: 'https://example.com/cover.jpg',
    type: 'MANGA',
};

describe('useBookmark', () => {
    it('deve ter savedIds vazio quando não há sessão', async () => {
        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-1')).toBe(false);
        });
    });

    it('deve carregar IDs salvos do /api/library quando sessão existe', async () => {
        seedAuthSession();

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(true));
    });

    it('deve retornar true para ID presente na lista', async () => {
        seedAuthSession();

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(true));
    });

    it('deve retornar false para ID ausente da lista', async () => {
        seedAuthSession();

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(true));

        expect(result.current.isSaved('title-unknown')).toBe(false);
    });

    it('deve adicionar ID otimistamente ao salvar', async () => {
        seedAuthSession();

        server.use(
            http.get('*/api/library', () =>
                HttpResponse.json({
                    data: {
                        content: [],
                        page: 0,
                        size: 20,
                        totalElements: 0,
                        totalPages: 0,
                        last: true,
                    },
                    success: true,
                }),
            ),
        );

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-new')).toBe(false);
        });

        await act(async () => {
            await result.current.toggleBookmark({
                titleId: 'title-new',
                name: 'Naruto',
                cover: 'https://example.com/naruto.jpg',
                type: 'MANGA',
            });
        });

        await waitFor(() => expect(result.current.isSaved('title-new')).toBe(true));
    });

    it('deve remover ID otimistamente ao desfazer bookmark', async () => {
        seedAuthSession();

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(true));

        await act(async () => {
            await result.current.toggleBookmark(bookmarkPayload);
        });

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(false));
    });

    it('deve fazer rollback ao falhar ao adicionar', async () => {
        seedAuthSession();

        server.use(
            http.get('*/api/library', () =>
                HttpResponse.json({
                    data: {
                        content: [],
                        page: 0,
                        size: 20,
                        totalElements: 0,
                        totalPages: 0,
                        last: true,
                    },
                    success: true,
                }),
            ),
            http.post('*/api/library', () => HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })),
        );

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => {
            expect(result.current.isSaved('title-fail')).toBe(false);
        });

        await act(async () => {
            await result.current.toggleBookmark({
                titleId: 'title-fail',
                name: 'Fail',
                cover: '',
                type: 'MANGA',
            });
        });

        expect(result.current.isSaved('title-fail')).toBe(false);
    });

    it('deve fazer rollback ao falhar ao remover', async () => {
        seedAuthSession();

        server.use(http.delete('*/api/library/:titleId', () => HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })));

        const { result } = renderHookWithProviders(() => useBookmark());

        await waitFor(() => expect(result.current.isSaved('title-1')).toBe(true));

        await act(async () => {
            await result.current.toggleBookmark(bookmarkPayload);
        });

        expect(result.current.isSaved('title-1')).toBe(true);
    });

    it('não deve carregar biblioteca sem sessão ativa', async () => {
        const fetchSpy = vi.fn();

        server.use(
            http.get('*/api/library', () => {
                fetchSpy();
                return HttpResponse.json({
                    data: {
                        content: [],
                        page: 0,
                        size: 20,
                        totalElements: 0,
                        totalPages: 0,
                        last: true,
                    },
                    success: true,
                });
            }),
        );

        renderHookWithProviders(() => useBookmark());

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
