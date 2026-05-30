import { useCallback } from 'react';

import useRatings from './useRatings';
import { showSuccessToast } from '@shared/service/util/toastService';

const useRating = (titleId: string) => {
    const { ratings, average, submitRating } = useRatings(titleId);

    const submit = useCallback(
        async (data: {
            funRating: number;
            artRating: number;
            storylineRating: number;
            charactersRating: number;
            originalityRating: number;
            pacingRating: number;
            comment?: string;
        }) => {
            try {
                await submitRating(data);
                showSuccessToast('Avaliação enviada com sucesso.');
            } catch {
                // Error toast já exibido pelo interceptor HTTP
            }
        },
        [submitRating],
    );

    return {
        ratings,
        average,
        submitRating: submit,
    };
};

export default useRating;
