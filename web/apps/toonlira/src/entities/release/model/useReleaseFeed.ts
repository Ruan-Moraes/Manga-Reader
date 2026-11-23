import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getReleaseFeed } from '../api/release.api';
import type { ReleaseQuery } from './release.types';

export const releaseQueryKey = (query: ReleaseQuery) => [QUERY_KEYS.RELEASES, query] as const;

export const useReleaseFeed = (query: ReleaseQuery) => useQuery({
    queryKey: releaseQueryKey(query),
    queryFn: () => getReleaseFeed(query),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
});
