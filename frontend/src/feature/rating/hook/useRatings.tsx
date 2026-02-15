import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    getRatingsAverage,
    getRatingsByTitleId,
    submitRating as submitRatingService,
} from '../service/ratingService';
import { MangaRating } from '../type/rating.types';

const useRatings = (titleId: string) => {
    const [ratings, setRatings] = useState<MangaRating[]>([]);

    const loadRatings = useCallback(async () => {
        const data = await getRatingsByTitleId(titleId);
        setRatings(data);
    }, [titleId]);

    useEffect(() => {
        loadRatings();
    }, [loadRatings]);

    const submitRating = useCallback(
        async ({ stars, comment }: { stars: number; comment?: string }) => {
            await submitRatingService({ titleId, stars, comment });
            await loadRatings();
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
