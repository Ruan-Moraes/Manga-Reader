import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getRatingsAverage,
    getTitleRatings,
    submitTitleRating,
} from '../../services/mock/mockRatingService';
import { MangaRating } from '../../types/RatingTypes';

const useRatings = (titleId: string) => {
    const [ratings, setRatings] = useState<MangaRating[]>([]);

    const loadRatings = useCallback(() => {
        setRatings(getTitleRatings(titleId));
    }, [titleId]);

    useEffect(() => {
        loadRatings();
    }, [loadRatings]);

    const submitRating = useCallback(
        ({ stars, comment }: { stars: number; comment?: string }) => {
            submitTitleRating({ titleId, stars, comment });
            loadRatings();
        },
        [loadRatings, titleId],
    );

    const average = useMemo(
        () => getRatingsAverage(titleId),
        [ratings, titleId],
    );

    return {
        ratings,
        average,
        submitRating,
    };
};

export default useRatings;
