import { useInfiniteQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getRatingsByTitleId } from '../api/ratingService';
import { REVIEW_SORT, type ReviewSortKey } from './reviewSort';

const PAGE_SIZE = 10;

type UseReviewsOptions = {
    sort?: ReviewSortKey;
    /** Filtro por faixa de estrela (1–5); null = todas */
    star?: number | null;
};

/**
 * Resenhas de um título com **paginação load-more server-side** (DT-47).
 * Ordenação e filtro por estrela são resolvidos no backend; a queryKey inclui
 * ambos para isolar o cache por combinação.
 */
const useReviews = (titleId: string, { sort = 'top', star = null }: UseReviewsOptions = {}) => {
    const { sort: sortField, direction } = REVIEW_SORT[sort];

    const query = useInfiniteQuery({
        queryKey: [QUERY_KEYS.RATINGS_BY_TITLE, titleId, sort, star],
        queryFn: ({ pageParam }) =>
            getRatingsByTitleId(titleId, {
                page: pageParam,
                size: PAGE_SIZE,
                sort: sortField,
                direction,
                star: star ?? undefined,
            }),
        initialPageParam: 0,
        getNextPageParam: lastPage => (lastPage.last ? undefined : lastPage.page + 1),
        enabled: Boolean(titleId),
        staleTime: 1000 * 60,
    });

    return {
        reviews: query.data?.pages.flatMap(page => page.content) ?? [],
        totalElements: query.data?.pages[0]?.totalElements ?? 0,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        isLoading: query.isLoading,
        isError: query.isError,
    };
};

export default useReviews;
