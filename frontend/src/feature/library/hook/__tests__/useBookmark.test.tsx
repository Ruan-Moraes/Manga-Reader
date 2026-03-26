import { act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '@/test/mocks/server';
import { seedAuthSession } from '@/test/testUtils';

import useBookmark from '../useBookmark';

const bookmarkPayload = {
    titleId: 'title-1',
    name: 'One Piece',
    cover: 'https://example.com/cover.jpg',
    type: 'MANGA',
};

describe('useBookmark', () => {
    // ── Estado inicial ────────────────────────────────────────────────────

    it('deve ter savedIds vazio quando não há sessão', async () => {
        const { result } = renderHook(() => useBookmark());

        // Aguarda estabilizar (nenhum fetch deve acontecer)
        await waitFor(() => {
            expect(result.current.isSaved('title-1')).toBe(false);
        });
    });

    it('deve carregar IDs salvos do /api/library quando sessão existe', async () => {
        seedAuthSession();

        const { result } = renderHook(() => useBookmark());

        await waitFor(() =>
            expect(result.current.isSaved('title-1')).toBe(true),
        );
    });

    // ── isSaved ───────────────────────────────────────────────────────────

    it('deve retornar true para ID presente na lista', async () => {
        seedAuthSession();

        const { result } = renderHook(() => useBookmark());

        await waitFor(() =>
            expect(result.current.isSaved('title-1')).toBe(true),
        );
    });

    it('deve retornar false para ID ausente da lista', async () => {
        seedAuthSession();

        const { result } = renderHook(() => useBookmark());

        await waitFor(() =>
            expect(result.current.isSaved('title-1')).toBe(true),
        );

        expect(result.current.isSaved('title-unknown')).toBe(false);
    });

    // ── toggleBookmark (adicionar) ────────────────────────────────────────

    it('deve adicionar ID otimistamente ao salvar', async () => {
        seedAuthSession();

        // Resposta vazia da library — sem itens salvos
        server.use(
            http.get('*/api/library', () => {
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

        const { result } = renderHook(() => useBookmark());

        // Aguarda mount effect
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

        expect(result.current.isSaved('title-new')).toBe(true);
    });

    // ── toggleBookmark (remover) ──────────────────────────────────────────

    it('deve remover ID otimistamente ao desfazer bookmark', async () => {
        seedAuthSession();

        const { result } = renderHook(() => useBookmark());

        await waitFor(() =>
            expect(result.current.isSaved('title-1')).toBe(true),
        );

        await act(async () => {
            await result.current.toggleBookmark(bookmarkPayload);
        });

        expect(result.current.isSaved('title-1')).toBe(false);
    });

    // ── Rollback em erro ──────────────────────────────────────────────────

    it('deve fazer rollback ao falhar ao adicionar', async () => {
        seedAuthSession();

        server.use(
            http.get('*/api/library', () => {
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
            http.post('*/api/library', () => {
                return HttpResponse.json(
                    { success: false, message: 'Server error' },
                    { status: 500 },
                );
            }),
        );

        const { result } = renderHook(() => useBookmark());

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

        // Rollback: ID não deve estar na lista
        expect(result.current.isSaved('title-fail')).toBe(false);
    });

    it('deve fazer rollback ao falhar ao remover', async () => {
        seedAuthSession();

        server.use(
            http.delete('*/api/library/:titleId', () => {
                return HttpResponse.json(
                    { success: false, message: 'Server error' },
                    { status: 500 },
                );
            }),
        );

        const { result } = renderHook(() => useBookmark());

        await waitFor(() =>
            expect(result.current.isSaved('title-1')).toBe(true),
        );

        await act(async () => {
            await result.current.toggleBookmark(bookmarkPayload);
        });

        // Rollback: ID deve voltar à lista
        expect(result.current.isSaved('title-1')).toBe(true);
    });

    // ── Guard sem sessão ──────────────────────────────────────────────────

    it('não deve carregar biblioteca sem sessão ativa', async () => {
        // Sem seedAuthSession — nenhum fetch deve acontecer
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

        renderHook(() => useBookmark());

        // Aguarda um tick para garantir que o efeito rodou
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(fetchSpy).not.toHaveBeenCalled();
    });
});
