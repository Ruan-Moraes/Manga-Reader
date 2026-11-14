import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getPublisherBySlug, getPublisherWorks } from '../api/publisherService';

export const usePublisher = (slug?: string) =>
    useQuery({
        queryKey: [QUERY_KEYS.PUBLISHER_DETAIL, slug],
        queryFn: ({ signal }) => getPublisherBySlug(slug!, signal),
        enabled: Boolean(slug),
        staleTime: 5 * 60 * 1000,
    });

export const usePublisherWorks = (publisherId: number | undefined, page: number, size = 20) =>
    useQuery({
        queryKey: [QUERY_KEYS.PUBLISHER_WORKS, publisherId, page, size],
        queryFn: ({ signal }) => getPublisherWorks(publisherId!, page, size, signal),
        enabled: publisherId != null,
        placeholderData: previous => previous,
    });
