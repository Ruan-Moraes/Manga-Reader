import { API_URLS } from '../../constants/API_CONSTANTS';

import useCommentsFetch from './data/useCommentsFetch';

const useComments = (id: number) => {
    const {
        data: comments,
        isLoading,
        isError,
        error,
        refetch,
    } = useCommentsFetch(API_URLS.COMMENTS_URL, id);

    return {
        comments,
        isLoading,
        isError,
        error,
        refetchComments: refetch,
    };
};

export default useComments;
