import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { TagsTypes } from '../../../types/TagsTypes';

const useTagsFetch = (
    queryKey: string,
    url: string,
    validTime?: number,
): UseQueryResult<TagsTypes[] | Error> => {
    return useQuery<TagsTypes[] | Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Ocorreu um erro ao buscar as tags');
            }

            const data: { id: number; name: string }[] = await response.json();

            return data.map(tag => ({
                value: tag.id,
                label: tag.name,
            }));
        },

        staleTime: validTime ? 1000 * 60 * 60 * 24 * validTime : 0,
    });
};

export default useTagsFetch;
