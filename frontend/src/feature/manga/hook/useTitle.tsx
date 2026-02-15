import useTitleFetch from './data/useTitleFetch';

const useTitle = (id: number) => {
    const {
        data: title,
        isLoading,
        isError,
        error,
        refetch,
    } = useTitleFetch(id);

    return {
        title,
        isLoading,
        isError,
        error,
        refetchTitle: refetch,
    };
};

export default useTitle;
