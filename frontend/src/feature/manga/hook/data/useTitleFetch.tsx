import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constant/ERROR_MESSAGES';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { Title } from '../../type/title.types';

import validateId from '@shared/service/util/validateId';
import { getTitleById } from '../../service/titleService';

const useTitleFetch = (id: number): UseQueryResult<Title | Error> => {
    return useQuery<Title, Error>({
        queryKey: [QUERY_KEYS.TITLES, id],
        queryFn: async () => {
            try {
                validateId(id);

                return await getTitleById(id);
            } catch (error) {
                console.error('Erro ao buscar título:', error);

                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },
    });
};

export default useTitleFetch;
