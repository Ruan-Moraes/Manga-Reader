import { useCallback } from 'react';

import useRatings from './useRatings';
import { showSuccessToast } from '@shared/service/util/toastService';

const useRating = (titleId: string) => {
    const { ratings, average, submitRating } = useRatings(titleId);

    const submit = useCallback(
        (
            rating: number,
            comment?: string,
            categoryRatings?: Record<string, number>,
        ) => {
            submitRating({ stars: rating, comment, categoryRatings });
            showSuccessToast('Avaliação enviada com sucesso.');
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
