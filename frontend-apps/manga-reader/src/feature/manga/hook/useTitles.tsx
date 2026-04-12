import useTitlesFetch from './data/useTitlesFetch';

const useTitles = (queryKeys: string, page = 0, size = 20) => {
    const {
        data: pageData,
        isLoading,
        isError,
        error,
        refetch,
    } = useTitlesFetch(queryKeys, page, size);

    return {
        titles: pageData?.content ?? [],
        totalPages: pageData?.totalPages ?? 0,
        totalElements: pageData?.totalElements ?? 0,
        isLoading,
        isError,
        error,
        refetchTitles: refetch,
    };
};

export default useTitles;
