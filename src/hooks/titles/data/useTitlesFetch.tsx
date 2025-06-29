import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';

import { TitleTypes } from '../../../types/TitleTypes';

import { showErrorToast } from '../../../utils/toastUtils';

import checkValidReturn from '../../../services/utils/checkValidReturn';

const useTitlesFetch = (
    url: string,
    queryKey: string,
): UseQueryResult<TitleTypes[] | Error> => {
    return useQuery<TitleTypes[], Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            try {
                const response = await fetch(url + '/' + queryKey);

                checkValidReturn(response);

                return await response.json();
            } catch (error) {
                showErrorToast(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }
        },

        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export default useTitlesFetch;
