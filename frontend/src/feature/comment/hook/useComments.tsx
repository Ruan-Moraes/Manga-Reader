import useCommentsFetch from './data/useCommentsFetch';

const useComments = (id: number) => {
    const {
        data: comments,
        isLoading,
        isError,
        error,
        refetch,
    } = useCommentsFetch(id);

    return {
        comments,
        isLoading,
        isError,
        error,
        refetchComments: refetch,
    };
};

export default useComments;
