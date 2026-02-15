import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/API_CONSTANTS';

import { Title } from '../../type/title.types';

import { getTitles } from '../../service/titleService';

const useTitlesFetch = (
    queryKey: string,
): UseQueryResult<Title[] | Error> => {
    return useQuery<Title[], Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            try {
                return await getTitles();
            } catch (error) {
                console.error('Erro ao buscar títulos:', error);

                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },

        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export default useTitlesFetch;
