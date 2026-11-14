import { useInfiniteQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getUserActivityFeed } from '../api/activityService';

const PAGE_SIZE = 20;

const useActivityFeed = (userId?: string) => {
    const query = useInfiniteQuery({
        queryKey: [QUERY_KEYS.ACTIVITY_FEED, userId],
        queryFn: ({ pageParam }) => getUserActivityFeed(userId as string, { page: pageParam, size: PAGE_SIZE }),
        initialPageParam: 0,
        getNextPageParam: lastPage => (lastPage.last ? undefined : lastPage.page + 1),
        enabled: Boolean(userId),
        staleTime: 1000 * 60,
    });

    return {
        events: query.data?.pages.flatMap(page => page.content) ?? [],
        totalElements: query.data?.pages[0]?.totalElements ?? 0,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
    };
};

export default useActivityFeed;
