import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { showSuccessToast } from '@shared/service/util/toastService';

import { updateReview } from '../api/reviewService';
import { type Review } from './review.types';

export type UpdateReviewInput = {
    id: string;
    funRating?: number;
    artRating?: number;
    storylineRating?: number;
    charactersRating?: number;
    originalityRating?: number;
    pacingRating?: number;
    comment?: string;
    reviewTitle?: string;
    spoiler?: boolean;
};

/**
 * Edita a própria resenha (PUT /api/ratings/{id}). Invalida as listas/resumos
 * afetados (perfil + título) para refletir notas/textos atualizados.
 */
const useUpdateReview = (titleId?: string) => {
    const queryClient = useQueryClient();

    return useMutation<Review, Error, UpdateReviewInput>({
        mutationFn: data => updateReview(data),
        onSuccess: () => {
            showSuccessToast('Avaliação atualizada com sucesso.');

            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_REVIEWS] });

            if (titleId) {
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATINGS_BY_TITLE, titleId] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_AVERAGE, titleId] });
                queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_DISTRIBUTION, titleId] });
            }
        },
    });
};

export default useUpdateReview;
