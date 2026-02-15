import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
    showSuccessToast,
    showErrorToast,
} from '@shared/service/util/toastUtils';

const useCommentCRUD = () => {
    const deleteCommentMutation = useMutation({
        // TODO: Chamar a API real para deletar o comentário
        mutationFn: async (id: string) => {
            return id;
        },
        onSuccess: () => {
            showSuccessToast(`Comentário deletado com sucesso.`, {
                toastId: 'delete-comment-success',
            }); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao deletar comentário:', error);

            showErrorToast('Erro ao deletar comentário.', {
                toastId: 'delete-comment-error',
            }); // TODO: Atualizar o estado da UI
        },
    });

    const editCommentMutation = useMutation({
        mutationFn: async ({
            id,
            newTextContent,
            newImageContent,
        }: {
            id: string;
            newTextContent: string | null;
            newImageContent: string | null;
        }) => {
            // TODO: Chamar a API real para editar o comentário

            return { id, newTextContent, newImageContent };
        },
        onSuccess: () => {
            showSuccessToast('Comentário editado com sucesso.', {
                toastId: 'edit-comment-success',
            }); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao editar comentário:', error);

            showErrorToast('Erro ao editar comentário.', {
                toastId: 'edit-comment-error',
            }); // TODO: Atualizar o estado da UI
        },
    });

    const replyCommentMutation = useMutation({
        mutationFn: async ({
            id,
            textContent,
            imageContent,
        }: {
            id: string;
            textContent: string | null;
            imageContent: string | null;
        }) => {
            // TODO: Chamar a API real para responder ao comentário

            return { id, textContent, imageContent };
        },
        onSuccess: () => {
            showSuccessToast('Resposta adicionada com sucesso.', {
                toastId: 'reply-comment-success',
            }); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao responder comentário:', error);

            showErrorToast('Erro ao responder comentário.', {
                toastId: 'reply-comment-error',
            }); // TODO: Atualizar o estado da UI
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
            textContent: string | null,
            imageContent: string | null,
        ) => {
            replyCommentMutation.mutate({ id, textContent, imageContent });
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
