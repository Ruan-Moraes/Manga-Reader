import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastService';

import {
    deleteComment as deleteCommentService,
    updateComment,
    createComment,
} from '../../service/commentService';

const useCommentCRUD = () => {
    const deleteCommentMutation = useMutation({
        mutationFn: async (id: string) => {
            await deleteCommentService(id);
            return id;
        },
        onSuccess: () => {
            showSuccessToast(`Comentário deletado com sucesso.`, {
                toastId: 'delete-comment-success',
            });
        },
        onError: () => {
            showErrorToast('Erro ao deletar comentário.', {
                toastId: 'delete-comment-error',
            });
        },
    });

    const editCommentMutation = useMutation({
        mutationFn: async ({
            id,
            newTextContent,
        }: {
            id: string;
            newTextContent: string | null;
            newImageContent: string | null;
        }) => {
            return await updateComment(id, newTextContent ?? '');
        },
        onSuccess: () => {
            showSuccessToast('Comentário editado com sucesso.', {
                toastId: 'edit-comment-success',
            });
        },
        onError: () => {
            showErrorToast('Erro ao editar comentário.', {
                toastId: 'edit-comment-error',
            });
        },
    });

    const replyCommentMutation = useMutation({
        mutationFn: async ({
            id,
            titleId,
            textContent,
        }: {
            id: string;
            titleId: string;
            textContent: string | null;
            imageContent: string | null;
        }) => {
            return await createComment({
                titleId,
                textContent: textContent ?? '',
                parentCommentId: id,
            });
        },
        onSuccess: () => {
            showSuccessToast('Resposta adicionada com sucesso.', {
                toastId: 'reply-comment-success',
            });
        },
        onError: () => {
            showErrorToast('Erro ao responder comentário.', {
                toastId: 'reply-comment-error',
            });
        },
    });

    const deleteComment = useCallback(
        (id: string) => {
            deleteCommentMutation.mutate(id);
        },
        [deleteCommentMutation],
    );

    const editComment = useCallback(
        (
            id: string,
            newTextContent: string | null,
            newImageContent: string | null,
        ) => {
            editCommentMutation.mutate({ id, newTextContent, newImageContent });
        },
        [editCommentMutation],
    );

    const replyComment = useCallback(
        (
            id: string,
            titleId: string,
            textContent: string | null,
            imageContent: string | null,
        ) => {
            replyCommentMutation.mutate({ id, titleId, textContent, imageContent });
        },
        [replyCommentMutation],
    );

    return {
        deleteComment,
        editComment,
        replyComment,
        isDeletingComment: deleteCommentMutation.isPending,
        isEditingComment: editCommentMutation.isPending,
        isReplyingComment: replyCommentMutation.isPending,
        deleteCommentError: deleteCommentMutation.error,
        editCommentError: editCommentMutation.error,
        replyCommentError: replyCommentMutation.error,
    };
};

export default useCommentCRUD;
