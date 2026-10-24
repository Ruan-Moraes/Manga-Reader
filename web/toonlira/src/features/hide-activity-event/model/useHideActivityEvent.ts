import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import type { ActivityEvent } from '@entities/activity';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { hideActivityEvent } from '../api/hideActivityEvent.api';

type FeedCache = InfiniteData<PageResponse<ActivityEvent>>;
type MutationContext = { snapshots: [readonly unknown[], FeedCache | undefined][] };

export const removeActivityEventFromFeed = (data: FeedCache | undefined, eventId: string): FeedCache | undefined => {
    if (!data) return data;

    const wasPresent = data.pages.some(page => page.content.some(event => event.id === eventId));
    if (!wasPresent) return data;

    const totalElements = Math.max(0, (data.pages[0]?.totalElements ?? 0) - 1);
    return {
        ...data,
        pages: data.pages.map(page => ({
            ...page,
            content: page.content.filter(event => event.id !== eventId),
            totalElements,
            totalPages: Math.ceil(totalElements / page.size),
        })),
    };
};

const useHideActivityEvent = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string, MutationContext>({
        mutationFn: hideActivityEvent,
        onMutate: async eventId => {
            await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.ACTIVITY_FEED] });
            const snapshots = queryClient.getQueriesData<FeedCache>({ queryKey: [QUERY_KEYS.ACTIVITY_FEED] });
            queryClient.setQueriesData<FeedCache>({ queryKey: [QUERY_KEYS.ACTIVITY_FEED] }, data => removeActivityEventFromFeed(data, eventId));
            return { snapshots };
        },
        onError: (_error, _eventId, context) => {
            context?.snapshots.forEach(([queryKey, data]) => queryClient.setQueryData<FeedCache>(queryKey, data));
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVITY_FEED] }),
    });
};

export default useHideActivityEvent;
