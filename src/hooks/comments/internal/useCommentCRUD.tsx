import {useCallback} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {toast} from "react-toastify";

type UseCommentCRUDProps = {
    queryKey: string;
};

const useCommentCRUD = ({queryKey}: UseCommentCRUDProps) => {
    const queryClient = useQueryClient();

    const deleteCommentMutation = useMutation({
        // TODO: Chamar a API real para deletar o comentário
        mutationFn: async (id: string) => {
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: [queryKey]});

            toast.success(`Comentário deletado com sucesso.`); // TODO: Atualizar o estado da UI
        },
        // TODO: Lidar com o erro na UI
        onError: error => {
            console.error('Erro ao deletar comentário:', error);

            toast.error('Erro ao deletar comentário.');
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

            return {id, newTextContent, newImageContent};
        },
        onSuccess: updatedComment => {
            queryClient.invalidateQueries({queryKey: [queryKey]});

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
            editCommentMutation.mutate({id, newTextContent, newImageContent});
        },
        [editCommentMutation],
    );

    return {
        deleteComment,
        editComment,
        isDeletingComment: deleteCommentMutation.isPending,
        isEditingComment: editCommentMutation.isPending,
        deleteCommentError: deleteCommentMutation.error,
        editCommentError: editCommentMutation.error,
    };
};

export default useCommentCRUD;
