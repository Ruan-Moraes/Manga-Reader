import { useCallback, useEffect, useState } from 'react';

import { requireAuth } from '@shared/service/util/requireAuth';

import {
    getRatingsAverage,
    getRatingsByTitleId,
    getRatingDistribution,
    submitRating as submitRatingService,
    type RatingDistribution,
} from '../api/ratingService';

import { MangaRating } from '@entities/rating';

type RatingAverageResult = {
    average: number;
    count: number;
};

const EMPTY_DISTRIBUTION: RatingDistribution = {
    star1: 0,
    star2: 0,
    star3: 0,
    star4: 0,
    star5: 0,
    total: 0,
};

const useRatings = (titleId: string) => {
    const [ratings, setRatings] = useState<MangaRating[]>([]);
    const [average, setAverage] = useState<RatingAverageResult>({
        average: 0,
        count: 0,
    });
    const [distribution, setDistribution] = useState<RatingDistribution>(EMPTY_DISTRIBUTION);

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

    const loadDistribution = useCallback(async () => {
        try {
            setDistribution(await getRatingDistribution(titleId));
        } catch {
            setDistribution(EMPTY_DISTRIBUTION);
        }
    }, [titleId]);

    useEffect(() => {
        loadRatings();

        loadAverage();

        loadDistribution();
    }, [loadRatings, loadAverage, loadDistribution]);

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
            if (!requireAuth('avaliar')) return;

            await submitRatingService({
                titleId,
                ...data,
            });

            await loadRatings();

            await loadAverage();

            await loadDistribution();
        },
        [loadRatings, loadAverage, loadDistribution, titleId],
    );

    return {
        ratings,
        average,
        distribution,
        submitRating,
    };
};

export default useRatings;
