import { act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '@/test/mocks/server';
import { renderHookWithProviders } from '@/test/testUtils';

import useCommentCRUD from '../useCommentCRUD';

vi.mock('@shared/service/util/toastService', () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

vi.mock('@shared/service/util/requireAuth', () => ({
    requireAuth: vi.fn(() => true),
}));

import { requireAuth } from '@shared/service/util/requireAuth';

import { showSuccessToast, showErrorToast } from '@shared/service/util/toastService';

describe('useCommentCRUD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve deletar comentário e mostrar toast de sucesso', async () => {
        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() => expect(result.current.isDeletingComment).toBe(false));

        expect(showSuccessToast).toHaveBeenCalledWith(
            'Comentário deletado com sucesso.',
            expect.objectContaining({ toastId: 'delete-comment-success' }),
        );
    });

    it('nao deve mostrar toast de erro local (delegado ao interceptor Axios)', async () => {
        server.use(
            http.delete('*/api/comments/:id', () => {
                return HttpResponse.json({ success: false, message: 'Not found' }, { status: 404 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.deleteComment('comment-nonexistent');
        });

        await waitFor(() => expect(result.current.deleteCommentError).not.toBeNull());

        // O toast de erro é disparado pelo interceptor Axios global (httpInterceptors.ts),
        // com a mensagem real do backend — não mais por um handler local com texto fixo.
        expect(showErrorToast).not.toHaveBeenCalledWith('Erro ao deletar comentário.', expect.anything());
    });

    it('deve editar comentário e mostrar toast de sucesso', async () => {
        let payload: Record<string, unknown> | null = null;
        server.use(
            http.put('*/api/comments/:id', async ({ request }) => {
                payload = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({
                    success: true,
                    data: {
                        id: 'comment-1',
                        targetType: 'TITLE',
                        targetId: 'title-1',
                        parentCommentId: null,
                        userId: 'user-1',
                        userName: 'User',
                        userPhoto: '',
                        isHighlighted: false,
                        edited: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        textContent: 'Updated text',
                        imageContent: 'https://example.com/edit.png',
                        upvotes: 0,
                        downvotes: 0,
                    },
                });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.editComment('comment-1', 'Updated text', 'https://example.com/edit.png');
        });

        await waitFor(() => expect(result.current.isEditingComment).toBe(false));

        expect(payload).toMatchObject({
            textContent: 'Updated text',
            imageContent: 'https://example.com/edit.png',
        });
        expect(showSuccessToast).toHaveBeenCalledWith(
            'Comentário editado com sucesso.',
            expect.objectContaining({ toastId: 'edit-comment-success' }),
        );
    });

    it('nao deve mostrar toast de erro local ao falhar ao editar (delegado ao interceptor Axios)', async () => {
        server.use(
            http.put('*/api/comments/:id', () => {
                return HttpResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.editComment('comment-1', 'Will fail', null);
        });

        await waitFor(() => expect(result.current.editCommentError).not.toBeNull());

        expect(showErrorToast).not.toHaveBeenCalledWith('Erro ao editar comentário.', expect.anything());
    });

    it('deve responder comentário e mostrar toast de sucesso', async () => {
        let payload: Record<string, unknown> | null = null;
        server.use(
            http.post('*/api/comments', async ({ request }) => {
                payload = (await request.json()) as Record<string, unknown>;
                return HttpResponse.json({
                    success: true,
                    data: {
                        id: 'reply-1',
                        targetType: 'TITLE',
                        targetId: 'title-1',
                        parentCommentId: 'comment-1',
                        userId: 'user-1',
                        userName: 'User',
                        userPhoto: '',
                        isHighlighted: false,
                        edited: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        textContent: 'Nice reply!',
                        imageContent: 'https://example.com/reply.png',
                        upvotes: 0,
                        downvotes: 0,
                    },
                });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.replyComment('comment-1', 'title-1', 'Nice reply!', 'https://example.com/reply.png');
        });

        await waitFor(() => expect(result.current.isReplyingComment).toBe(false));

        expect(payload).toMatchObject({
            targetType: 'TITLE',
            targetId: 'title-1',
            parentCommentId: 'comment-1',
            imageContent: 'https://example.com/reply.png',
        });
        expect(showSuccessToast).toHaveBeenCalledWith(
            'Resposta adicionada com sucesso.',
            expect.objectContaining({ toastId: 'reply-comment-success' }),
        );
    });

    it('nao deve mostrar toast de erro local ao falhar ao responder (delegado ao interceptor Axios)', async () => {
        server.use(
            http.post('*/api/comments', () => {
                return HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.replyComment('comment-1', 'title-1', 'Will fail', null);
        });

        await waitFor(() => expect(result.current.replyCommentError).not.toBeNull());

        expect(showErrorToast).not.toHaveBeenCalledWith('Erro ao responder comentário.', expect.anything());
    });

    it('deve indicar isDeletingComment como true durante mutation', async () => {
        // Handler lento para capturar o estado de loading
        server.use(
            http.delete('*/api/comments/:id', async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return new HttpResponse(null, { status: 204 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() => expect(result.current.isDeletingComment).toBe(true));

        // Aguarda completar
        await waitFor(() => expect(result.current.isDeletingComment).toBe(false));
    });

    it('deve expor erro da mutation após falha', async () => {
        server.use(
            http.delete('*/api/comments/:id', () => {
                return HttpResponse.json({ success: false, message: 'Error' }, { status: 500 });
            }),
        );

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.deleteComment('comment-1');
        });

        await waitFor(() => expect(result.current.deleteCommentError).not.toBeNull());
    });

    it('deve bloquear mutações quando não autenticado', () => {
        vi.mocked(requireAuth).mockReturnValue(false);

        const { result } = renderHookWithProviders(() => useCommentCRUD('TITLE'));

        act(() => {
            result.current.deleteComment('comment-1');
            result.current.editComment('comment-1', 'text', null);
            result.current.replyComment('comment-1', 'title-1', 'text', null);
        });

        expect(requireAuth).toHaveBeenCalledWith('deletar comentários');
        expect(requireAuth).toHaveBeenCalledWith('editar comentários');
        expect(requireAuth).toHaveBeenCalledWith('responder comentários');

        expect(result.current.isDeletingComment).toBe(false);
        expect(result.current.isEditingComment).toBe(false);
        expect(result.current.isReplyingComment).toBe(false);

        vi.mocked(requireAuth).mockReturnValue(true);
    });
});
