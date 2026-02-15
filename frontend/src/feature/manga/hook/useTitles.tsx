import useTitlesFetch from './data/useTitlesFetch';

const useTitles = (queryKeys: string) => {
    const {
        data: titles,
        isLoading,
        isError,
        error,
        refetch,
    } = useTitlesFetch(queryKeys);

    return {
        titles,
        isLoading,
        isError,
        error,
        refetchTitles: refetch,
    };
};

export default useTitles;
