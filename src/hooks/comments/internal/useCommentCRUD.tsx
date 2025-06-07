import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'react-toastify';

type UseCommentCRUDProps = {
    queryKey: string;
};

const useCommentCRUD = ({ queryKey }: UseCommentCRUDProps) => {
    const queryClient = useQueryClient();

    const deleteCommentMutation = useMutation({
        // TODO: Chamar a API real para deletar o comentário
        mutationFn: async (id: string) => {
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });

            toast.success(`Comentário deletado com sucesso.`); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao deletar comentário:', error);

            toast.error('Erro ao deletar comentário.'); // TODO: Atualizar o estado da UI
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
            queryClient.invalidateQueries({ queryKey: [queryKey] });

            toast.success('Comentário editado com sucesso.'); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao editar comentário:', error);

            toast.error('Erro ao editar comentário.'); // TODO: Atualizar o estado da UI
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
            queryClient.invalidateQueries({ queryKey: [queryKey] });

            toast.success('Resposta adicionada com sucesso.'); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao responder comentário:', error);

            toast.error('Erro ao responder comentário.'); // TODO: Atualizar o estado da UI
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
