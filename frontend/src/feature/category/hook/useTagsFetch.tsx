import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { Tag } from '../type/tag.types';

import { getTags } from '../service/tagService';

const useTagsFetch = (queryKey: string): UseQueryResult<Tag[] | Error> => {
    return useQuery<Tag[] | Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            return await getTags();
        },

        staleTime: 1000 * 60 * 60 * 24,
    });
};

export default useTagsFetch;
