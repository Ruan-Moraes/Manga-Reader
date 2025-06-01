import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type UseCommentCRUDProps = {
    queryKey: string;
};

const useCommentCRUD = ({ queryKey }: UseCommentCRUDProps) => {
    const queryClient = useQueryClient();

    const deleteCommentMutation = useMutation({
        // TODO: Chamar a API real para deletar o comentário
        mutationFn: async (id: string) => {
            console.log(`Simulando exclusão do comentário com ID: ${id}`);

            return id;
        },
        onSuccess: deletedId => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });

            console.log(
                `Comentário ${deletedId} deletado com sucesso (e dados refetchados).`,
            );
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao deletar comentário:', error);
        },
    });

    const editCommentMutation = useMutation({
        mutationFn: async ({
            id,
            newTextContent,
            newImageContent,
        }: {
            id: string;
            newTextContent?: string;
            newImageContent?: string;
        }) => {
            // TODO: Chamar a API real para editar o comentário
            console.log(`Simulando edição do comentário com ID: ${id}`);

            return { id, newTextContent, newImageContent };
        },
        onSuccess: updatedComment => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });

            console.log(
                `Comentário ${updatedComment.id} editado com sucesso (e dados refetchados).`,
            );
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao editar comentário:', error);
        },
    });

    const deleteComment = useCallback(
        (id: string) => {
            deleteCommentMutation.mutate(id);
        },
        [deleteCommentMutation],
    );

    const editComment = useCallback(
        (id: string, newTextContent?: string, newImageContent?: string) => {
            editCommentMutation.mutate({ id, newTextContent, newImageContent });
        },
        [editCommentMutation],
    );

    return {
        deleteComment,
        editComment,
        isDeleting: deleteCommentMutation.isPending,
        isEditing: editCommentMutation.isPending,
        deleteError: deleteCommentMutation.error,
        editError: editCommentMutation.error,
    };
};

export default useCommentCRUD;
