import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { TagsTypes } from '../../../types/TagsTypes';

import checkValidReturn from '../../../services/utils/checkValidReturn';

const useTagsFetch = (
    queryKey: string,
    url: string,
): UseQueryResult<TagsTypes[] | Error> => {
    return useQuery<TagsTypes[] | Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            const response = await fetch(url);

            checkValidReturn(response);

            const data: { id: number; name: string }[] = await response.json();

            return data.map(tag => ({
                value: tag.id,
                label: tag.name,
            }));
        },

        staleTime: 1000 * 60 * 60 * 24,
    });
};

export default useTagsFetch;
