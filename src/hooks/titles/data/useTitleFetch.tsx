import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES, QUERY_KEYS } from '../../../constants/API_CONSTANTS';

import { TitleTypes } from '../../../types/TitleTypes';

import { showErrorToast } from '../../../utils/toastUtils';

import checkValidReturn from '../../../services/utils/checkValidReturn';
import checkValidId from '../../../services/utils/checkValidId';

const useTitleFetch = (
    url: string,
    id: number,
): UseQueryResult<TitleTypes, Error> => {
    return useQuery<TitleTypes, Error>({
        queryKey: [QUERY_KEYS.TITLES, id],
        queryFn: async () => {
            try {
                checkValidId(id);

                const response = await fetch(
                    url + '/' + QUERY_KEYS.TITLES + '/' + id,
                );

                checkValidReturn(response);

                return await response.json();
            } catch (error) {
                showErrorToast(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },
    });
};

export default useTitleFetch;
