import { API_URLS } from '../../constants/API_CONSTANTS';

import useTitlesFetch from './data/useTitlesFetch';

export const useTitles = ({ id }: { id: string }) => {
    const {
        data: titles,
        isLoading,
        isError,
        error,
        refetch,
    } = useTitlesFetch(API_URLS.TITLE_URL, id);

    return {
        titles,
        isLoading,
        isError,
        error,
        refetchTitles: refetch,
    };
};

export default useTitles;
