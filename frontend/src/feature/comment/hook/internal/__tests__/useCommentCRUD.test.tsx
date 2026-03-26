import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/test/mocks/server';
import { renderHookWithProviders } from '@/test/testUtils';

import useCommentCRUD from '../useCommentCRUD';

// Mock toast service para verificar chamadas
vi.mock('@shared/service/util/toastService', () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

import { showSuccessToast, showErrorToast } from '@shared/service/util/toastService';

describe('useCommentCRUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── deleteComment ─────────────────────────────────────────────────────

    it('deve deletar comentário e mostrar toast de sucesso', async () => {
        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() =>
            expect(result.current.isDeletingComment).toBe(false),
        );

        expect(showSuccessToast).toHaveBeenCalledWith(
            'Comentário deletado com sucesso.',
            expect.objectContaining({ toastId: 'delete-comment-success' }),
        );
    });

    it('deve mostrar toast de erro ao falhar ao deletar', async () => {
        server.use(
            http.delete('*/api/comments/:id', () => {
                return HttpResponse.json(
                    { success: false, message: 'Not found' },
                    { status: 404 },
                );
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.deleteComment('comment-nonexistent');
        });

        await waitFor(() =>
            expect(showErrorToast).toHaveBeenCalledWith(
                'Erro ao deletar comentário.',
                expect.objectContaining({ toastId: 'delete-comment-error' }),
            ),
        );
    });

    // ── editComment ─────────────────────��─────────────────────────────────

    it('deve editar comentário e mostrar toast de sucesso', async () => {
        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.editComment('comment-1', 'Updated text', null);
        });

        await waitFor(() =>
            expect(result.current.isEditingComment).toBe(false),
        );

        expect(showSuccessToast).toHaveBeenCalledWith(
            'Comentário editado com sucesso.',
            expect.objectContaining({ toastId: 'edit-comment-success' }),
        );
    });

    it('deve mostrar toast de erro ao falhar ao editar', async () => {
        server.use(
            http.put('*/api/comments/:id', () => {
                return HttpResponse.json(
                    { success: false, message: 'Forbidden' },
                    { status: 403 },
                );
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.editComment('comment-1', 'Will fail', null);
        });

        await waitFor(() =>
            expect(showErrorToast).toHaveBeenCalledWith(
                'Erro ao editar comentário.',
                expect.objectContaining({ toastId: 'edit-comment-error' }),
            ),
        );
    });

    // ── replyComment ────────────────────────────────────────────────────���─

    it('deve responder comentário e mostrar toast de sucesso', async () => {
        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.replyComment(
                'comment-1',
                'title-1',
                'Nice reply!',
                null,
            );
        });

        await waitFor(() =>
            expect(result.current.isReplyingComment).toBe(false),
        );

        expect(showSuccessToast).toHaveBeenCalledWith(
            'Resposta adicionada com sucesso.',
            expect.objectContaining({ toastId: 'reply-comment-success' }),
        );
    });

    it('deve mostrar toast de erro ao falhar ao responder', async () => {
        server.use(
            http.post('*/api/comments', () => {
                return HttpResponse.json(
                    { success: false, message: 'Server error' },
                    { status: 500 },
                );
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.replyComment(
                'comment-1',
                'title-1',
                'Will fail',
                null,
            );
        });

        await waitFor(() =>
            expect(showErrorToast).toHaveBeenCalledWith(
                'Erro ao responder comentário.',
                expect.objectContaining({ toastId: 'reply-comment-error' }),
            ),
        );
    });

    // ── Loading states ─────────────────────���─────────────────────────��────

    it('deve indicar isDeletingComment como true durante mutation', async () => {
        // Handler lento para capturar o estado de loading
        server.use(
            http.delete('*/api/comments/:id', async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return new HttpResponse(null, { status: 204 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() =>
            expect(result.current.isDeletingComment).toBe(true),
        );

        // Aguarda completar
        await waitFor(() =>
            expect(result.current.isDeletingComment).toBe(false),
        );
    });

    it('deve expor erro da mutation após falha', async () => {
        server.use(
            http.delete('*/api/comments/:id', () => {
                return HttpResponse.json(
                    { success: false, message: 'Error' },
                    { status: 500 },
                );
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD());

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() =>
            expect(result.current.deleteCommentError).not.toBeNull(),
        );
    });
});
