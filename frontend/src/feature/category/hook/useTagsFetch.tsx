import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { Tag } from '../type/tag.types';

import { getTags } from '../service/tagService';

const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;

const useTagsFetch = (): UseQueryResult<Tag[]> => {
    return useQuery<Tag[]>({
        queryKey: ['tags'],
        queryFn: getTags,
        staleTime: THREE_DAYS_MS,
        gcTime: THREE_DAYS_MS,
    });
};

export default useTagsFetch;
