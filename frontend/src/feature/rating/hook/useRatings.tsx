import { useCallback, useEffect, useState } from 'react';

import {
    getRatingsAverage,
    getRatingsByTitleId,
    submitRating as submitRatingService,
} from '../service/ratingService';
import { MangaRating } from '../type/rating.types';

type RatingAverageResult = {
    average: number;
    count: number;
};

const useRatings = (titleId: string) => {
    const [ratings, setRatings] = useState<MangaRating[]>([]);
    const [average, setAverage] = useState<RatingAverageResult>({
        average: 0,
        count: 0,
    });

    const loadRatings = useCallback(async () => {
        const data = await getRatingsByTitleId(titleId);
        setRatings(data.content);
    }, [titleId]);

    const loadAverage = useCallback(async () => {
        const data = await getRatingsAverage(titleId);
        setAverage({ average: data.average, count: data.count });
    }, [titleId]);

    useEffect(() => {
        loadRatings();
        loadAverage();
    }, [loadRatings, loadAverage]);

    const submitRating = useCallback(
        async ({
            stars,
            comment,
            categoryRatings,
        }: {
            stars: number;
            comment?: string;
            categoryRatings?: Record<string, number>;
        }) => {
            await submitRatingService({
                titleId,
                stars,
                comment,
                categoryRatings,
            });
            await loadRatings();
            await loadAverage();
        },
        [loadRatings, loadAverage, titleId],
    );

    return {
        ratings,
        average,
        submitRating,
    };
};

export default useRatings;
