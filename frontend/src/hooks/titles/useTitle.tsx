import { API_URLS } from '../../constants/API_CONSTANTS';

import useTitleFetch from './data/useTitleFetch';

const useTitle = (id: number) => {
    const {
        data: title,
        isLoading,
        isError,
        error,
        refetch,
    } = useTitleFetch(API_URLS.TITLE_URL, id);

    return {
        title,
        isLoading,
        isError,
        error,
        refetchTitle: refetch,
    };
};

export default useTitle;
