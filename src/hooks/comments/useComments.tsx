import useCommentsFetch from './data/useCommentsFetch';
import useCommentCRUD from './internal/useCommentCRUD';
import useCommentTree from './internal/useCommentTree';

const COMMENTS_QUERY_KEY = 'comments';

export const useComments = () => {
    const {
        data: comments,
        isLoading,
        isError,
        error,
        refetch,
    } = useCommentsFetch(COMMENTS_QUERY_KEY, '/api/comments');

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
        queryKey: COMMENTS_QUERY_KEY,
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
