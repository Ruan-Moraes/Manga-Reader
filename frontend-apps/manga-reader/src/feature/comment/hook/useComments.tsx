import useCommentsFetch from './data/useCommentsFetch';

const useComments = (id: string, page = 0, size = 20) => {
    const {
        data: pageData,
        isLoading,
        isError,
        error,
        refetch,
    } = useCommentsFetch(id, page, size);

    return {
        comments: pageData?.content ?? [],
        totalPages: pageData?.totalPages ?? 0,
        totalElements: pageData?.totalElements ?? 0,
        isLoading,
        isError,
        error,
        refetchComments: refetch,
    };
};

export default useComments;
