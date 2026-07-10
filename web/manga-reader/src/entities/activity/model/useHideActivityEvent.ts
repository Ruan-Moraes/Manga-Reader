import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import type { PageResponse } from '@shared/service/http';

import { hideActivityEvent } from '../api/activityService';
import type { ActivityEvent } from './activity.types';

/**
 * Oculta um evento do próprio feed. Remove o item otimisticamente de todas as
 * páginas em cache (qualquer userId), evitando esperar um refetch completo.
 */
const useHideActivityEvent = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: eventId => hideActivityEvent(eventId),
        onSuccess: (_data, eventId) => {
            queryClient.setQueriesData<InfiniteData<PageResponse<ActivityEvent>>>(
                { queryKey: [QUERY_KEYS.ACTIVITY_FEED] },
                oldData => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map(page => ({
                            ...page,
                            content: page.content.filter(event => event.id !== eventId),
                        })),
                    };
                },
            );
        },
    });
};

export default useHideActivityEvent;
