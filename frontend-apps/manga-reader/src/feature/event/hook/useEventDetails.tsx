import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getEventById, getRelatedEvents } from '../service/eventService';
import type { EventData } from '../type/event.types';

const THIRTY_MINUTES = 1000 * 60 * 30;

const useEventDetails = (eventId: string) => {
    const eventQuery = useQuery<EventData, Error>({
        queryKey: [QUERY_KEYS.EVENT, eventId],
        queryFn: () => getEventById(eventId),
        enabled: Boolean(eventId),
        staleTime: THIRTY_MINUTES,
    });

    const event = eventQuery.data ?? null;

    const relatedQuery = useQuery<EventData[], Error>({
        queryKey: [QUERY_KEYS.EVENT_RELATED, event?.id],
        queryFn: () => getRelatedEvents(event!.id),
        enabled: Boolean(event?.id),
        staleTime: THIRTY_MINUTES,
    });

    return {
        event,
        relatedEvents: relatedQuery.data ?? [],
        isLoading: eventQuery.isLoading,
        isError: eventQuery.isError,
    };
};

export default useEventDetails;
