import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES, QUERY_KEYS } from '@shared/constant/API_CONSTANTS';

import { Title } from '../../type/title.types';

import checkValidId from '@shared/service/util/checkValidId';
import { getTitleById } from '../../service/titleService';

const useTitleFetch = (
    id: number,
): UseQueryResult<Title | Error> => {
    return useQuery<Title, Error>({
        queryKey: [QUERY_KEYS.TITLES, id],
        queryFn: async () => {
            try {
                checkValidId(id);

                return await getTitleById(id);
            } catch (error) {
                console.error('Erro ao buscar título:', error);

                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },
    });
};

export default useTitleFetch;
