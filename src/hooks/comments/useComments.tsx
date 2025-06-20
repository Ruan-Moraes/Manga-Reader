import { API_URLS, QUERY_KEYS } from '../../constants/API_CONSTANTS';

import useCommentsFetch from './data/useCommentsFetch';
import useCommentCRUD from './internal/useCommentCRUD';
import useCommentTree from './internal/useCommentTree';

export const useComments = () => {
    const {
        data: comments,
        isLoading,
        isError,
        error,
        refetch,
    } = useCommentsFetch(API_URLS.COMMENTS_URL, QUERY_KEYS.COMMENTS);

    const {
        deleteComment,
        editComment,
        replyComment,
        isDeletingComment,
        isEditingComment,
        isReplyingComment,
        deleteCommentError,
        editCommentError,
        replyCommentError,
    } = useCommentCRUD({
        queryKey: QUERY_KEYS.COMMENTS,
    });

    const { getCommentsTree } = useCommentTree(comments || []);

    return {
        commentsTree: getCommentsTree(),
        isLoading,
        isError,
        error,
        deleteComment,
        editComment,
        replyComment,
        isDeletingComment,
        isEditingComment,
        isReplyingComment,
        deleteCommentError,
        editCommentError,
        replyCommentError,
        refetchComments: refetch,
    };
};
