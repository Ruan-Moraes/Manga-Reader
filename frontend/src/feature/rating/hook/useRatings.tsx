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
        try {
            const data = await getRatingsByTitleId(titleId);
            setRatings(data.content);
        } catch {
            setRatings([]);
        }
    }, [titleId]);

    const loadAverage = useCallback(async () => {
        try {
            const data = await getRatingsAverage(titleId);
            setAverage({ average: data.average, count: data.count });
        } catch {
            setAverage({ average: 0, count: 0 });
        }
    }, [titleId]);

    useEffect(() => {
        loadRatings();
        loadAverage();
    }, [loadRatings, loadAverage]);

    const submitRating = useCallback(
        async (data: {
            funRating: number;
            artRating: number;
            storylineRating: number;
            charactersRating: number;
            originalityRating: number;
            pacingRating: number;
            comment?: string;
        }) => {
            await submitRatingService({
                titleId,
                ...data,
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
