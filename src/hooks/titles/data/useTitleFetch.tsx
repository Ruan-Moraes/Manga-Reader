import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';

import { TitleTypes } from '../../../types/TitleTypes';

const useTitleFetch = (
    url: string,
    id: number,
): UseQueryResult<TitleTypes | Error> => {
    return useQuery<TitleTypes, Error>({
        queryKey: [id],
        queryFn: async () => {
            if (isNaN(id)) {
                return Promise.reject(
                    new Error(ERROR_MESSAGES.INVALID_ID_ERROR),
                );
            }

            const response = await fetch(url + '/' + id);

            if (response === null || response === undefined || !response.ok) {
                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }

            const data: TitleTypes = await response.json();

            return data;
        },
    });
};

export default useTitleFetch;
