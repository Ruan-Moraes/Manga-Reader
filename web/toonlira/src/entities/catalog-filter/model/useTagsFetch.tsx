import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { Tag } from '../model/tag.types';

import { getTags } from '../api/tagService';

const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;

const useTagsFetch = (): UseQueryResult<Tag[]> => {
    return useQuery<Tag[]>({
        queryKey: [QUERY_KEYS.TAGS],
        queryFn: getTags,
        staleTime: THREE_DAYS_MS,
        gcTime: THREE_DAYS_MS,
    });
};

export default useTagsFetch;
