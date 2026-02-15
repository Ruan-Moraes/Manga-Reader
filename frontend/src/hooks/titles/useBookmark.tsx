import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
    showSuccessToast,
    showErrorToast,
} from '../../services/utils/toastUtils';

const useBookmark = () => {
    const bookmarkMutation = useMutation({
        mutationFn: async ({
            titleId,
            isBookmarked,
        }: {
            titleId: number;
            isBookmarked: boolean;
        }) => {
            // TODO: Chamar a API real para bookmark/unbookmark
            return { titleId, isBookmarked: !isBookmarked };
        },
        onSuccess: data => {
            const message = data.isBookmarked
                ? 'Título adicionado aos favoritos.'
                : 'Título removido dos favoritos.';
            showSuccessToast(message, {
                toastId: 'bookmark-success',
            }); // TODO: Atualizar o estado da UI
        },
        onError: error => {
            console.error('Erro ao alterar bookmark:', error);
            showErrorToast('Erro ao alterar favorito.', {
                toastId: 'bookmark-error',
            }); // TODO: Atualizar o estado da UI
        },
    });

    const toggleBookmark = useCallback(
        (titleId: number, isBookmarked: boolean) => {
            bookmarkMutation.mutate({ titleId, isBookmarked });
        },
        [bookmarkMutation],
    );

    return {
        toggleBookmark,
        isBookmarking: bookmarkMutation.isPending,
        bookmarkError: bookmarkMutation.error,
        bookmarkData: bookmarkMutation.data,
    };
};

export default useBookmark;
