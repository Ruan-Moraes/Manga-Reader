import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '../../../constants/API_CONSTANTS';

import { TitleTypes } from '../../../types/TitleTypes';

const useTitlesFetch = (
    url: string,
    queryKey: string,
): UseQueryResult<TitleTypes[] | Error> => {
    return useQuery<TitleTypes[], Error>({
        queryKey: [queryKey],
        queryFn: async () => {
            try {
                const response = await fetch(url + '/' + queryKey);

                if (
                    response === null ||
                    response === undefined ||
                    !response.ok
                ) {
                    throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
                }

                const data: TitleTypes[] = await response.json();

                return data;
            } catch (error) {
                if (error instanceof Error) {
                    return Promise.reject(error);
                }

                return Promise.reject(
                    new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR),
                );

                console.log(error);
            }
        },

        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export default useTitlesFetch;
