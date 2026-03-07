import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import type { PageResponse } from '@shared/service/http';

import { Title } from '../../type/title.types';

import { getTitles } from '../../service/titleService';

const useTitlesFetch = (
    queryKey: string,
    page = 0,
    size = 20,
): UseQueryResult<PageResponse<Title>, Error> => {
    return useQuery<PageResponse<Title>, Error>({
        queryKey: [queryKey, page, size],
        queryFn: async () => {
            try {
                return await getTitles(page, size);
            } catch (error) {
                console.error('Erro ao buscar títulos:', error);

                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },

        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export default useTitlesFetch;
