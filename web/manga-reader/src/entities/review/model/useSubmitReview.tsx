import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { requireAuth } from '@shared/service/util/requireAuth';
import { showSuccessToast } from '@shared/service/util/toastService';

import { submitRating } from '../api/reviewService';
import { type Review } from './review.types';

export type SubmitReviewInput = {
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
    reviewTitle?: string;
    spoiler?: boolean;
};

/**
 * Submete/atualiza (upsert) a resenha do usuário (DT-47). Exige auth, mostra
 * toast de sucesso e invalida as queries de resenha/média/distribuição do
 * título para refletir a persistência.
 */
const useSubmitReview = (titleId: string) => {
    const queryClient = useQueryClient();

    return useMutation<Review, Error, SubmitReviewInput>({
        mutationFn: data => {
            if (!requireAuth('avaliar')) {
                return Promise.reject(new Error('auth-required'));
            }

            return submitRating({ titleId, ...data });
        },
        onSuccess: () => {
            showSuccessToast('Avaliação enviada com sucesso.');

            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATINGS_BY_TITLE, titleId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_AVERAGE, titleId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.RATING_DISTRIBUTION, titleId] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_REVIEWS] });
        },
        // Erros de rede já são exibidos pelo interceptor HTTP; auth-required já
        // exibiu seu próprio toast via requireAuth.
    });
};

export default useSubmitReview;
