import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import {
    showSuccessToast,
    showErrorToast,
} from '../../services/utils/toastUtils';

const useRating = () => {
    const ratingMutation = useMutation({
        mutationFn: async ({
            titleId,
            rating,
        }: {
            titleId: number;
            rating: number;
        }) => {
            // TODO: Chamar a API real para avaliar o título

            return { titleId, rating };
        },
        onSuccess: data => {
            showSuccessToast(
                `Avaliação ${data.rating}/10 enviada com sucesso.`,
                {
                    toastId: 'rating-success',
                },
            ); // TODO: Atualizar o estado da UI
        },
        onError: error => {
            console.error('Erro ao avaliar título:', error);

            showErrorToast('Erro ao enviar avaliação.', {
                toastId: 'rating-error',
            }); // TODO: Atualizar o estado da UI
        },
    });

    const submitRating = useCallback(
        (titleId: number, rating: number) => {
            if (rating < 0 || rating > 10) {
                showErrorToast('A avaliação deve estar entre 0 e 10.', {
                    toastId: 'rating-validation-error',
                });

                return;
            }

            ratingMutation.mutate({ titleId, rating });
        },
        [ratingMutation],
    );

    return {
        submitRating,
        isSubmittingRating: ratingMutation.isPending,
        ratingError: ratingMutation.error,
        ratingData: ratingMutation.data,
    };
};

export default useRating;
