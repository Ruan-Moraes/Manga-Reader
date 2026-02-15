import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES, QUERY_KEYS } from '../../../constants/API_CONSTANTS';

import { TitleTypes } from '../../../types/TitleTypes';

import checkValidReturn from '../../../services/utils/checkValidReturn';
import checkValidId from '../../../services/utils/checkValidId';

const useTitleFetch = (
    url: string,
    id: number,
): UseQueryResult<TitleTypes | Error> => {
    return useQuery<TitleTypes, Error>({
        queryKey: [QUERY_KEYS.TITLES, id],
        queryFn: async () => {
            try {
                checkValidId(id);

                const response = await fetch(
                    url + '/' + QUERY_KEYS.TITLES + '/' + id,
                );

                checkValidReturn(response);

                const title: TitleTypes = await response.json();

                return title;
            } catch (error) {
                console.error('Erro ao buscar título:', error);

                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },
    });
};

export default useTitleFetch;
