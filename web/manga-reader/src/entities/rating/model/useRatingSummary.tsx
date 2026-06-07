import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getRatingsAverage, getRatingDistribution, type RatingDistribution } from '../api/ratingService';

const EMPTY_DISTRIBUTION: RatingDistribution = {
    star1: 0,
    star2: 0,
    star3: 0,
    star4: 0,
    star5: 0,
    total: 0,
};

/**
 * Média + distribuição de estrelas de um título (DT-47). Duas queries
 * independentes p/ invalidação granular pelas mutations de submit/voto.
 */
const useRatingSummary = (titleId: string) => {
    const averageQuery = useQuery({
        queryKey: [QUERY_KEYS.RATING_AVERAGE, titleId],
        queryFn: () => getRatingsAverage(titleId),
        enabled: Boolean(titleId),
        staleTime: 1000 * 60,
    });

    const distributionQuery = useQuery({
        queryKey: [QUERY_KEYS.RATING_DISTRIBUTION, titleId],
        queryFn: () => getRatingDistribution(titleId),
        enabled: Boolean(titleId),
        staleTime: 1000 * 60,
    });

    return {
        average: averageQuery.data ?? { average: 0, count: 0 },
        distribution: distributionQuery.data ?? EMPTY_DISTRIBUTION,
        isLoading: averageQuery.isLoading || distributionQuery.isLoading,
    };
};

export default useRatingSummary;
