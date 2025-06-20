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
            let response = null;

            if (!isNaN(Number(queryKey))) {
                if (url.endsWith('/')) {
                    url = url.slice(0, -1);
                }

                console.log(`${url}?title=${queryKey}`);

                response = await fetch(`${url}?title=${queryKey}`);
            }

            if (isNaN(Number(queryKey))) {
                response = await fetch(url + queryKey);
            }

            if (response === null || response === undefined || !response.ok) {
                throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
            }

            const data: TitleTypes[] = await response.json();

            return data;
        },

        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};

export default useTitlesFetch;
