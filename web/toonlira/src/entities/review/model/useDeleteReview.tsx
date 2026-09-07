import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { showSuccessToast } from '@shared/service/util/toastService';

import { deleteReview } from '../api/reviewService';

/**
 * Exclui a própria resenha (DELETE /api/ratings/{id}). Invalida as
 * listas/resumos afetados (perfil + título).
 */
const useDeleteReview = (titleId?: string) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: id => deleteReview(id),
        onSuccess: () => {
            showSuccessToast('Avaliação excluída.');

            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_REVIEWS] });

            if (titleId) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATINGS_BY_TITLE, titleId] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_AVERAGE, titleId] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_DISTRIBUTION, titleId] });
            }
        },
    });
};

export default useDeleteReview;
