import { useCallback } from 'react';

import useRatings from './useRatings';
import { showSuccessToast } from '@shared/service/util/toastService';

const useRating = (titleId: string) => {
    const { ratings, average, submitRating } = useRatings(titleId);

    const submit = useCallback(
        (rating: number, comment?: string) => {
            submitRating({ stars: rating, comment });
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
