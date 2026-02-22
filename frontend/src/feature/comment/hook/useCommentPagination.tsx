import { useCallback, useEffect, useMemo, useState } from 'react';

const COMMENTS_PER_PAGE = 10;

const useCommentPagination = <T,>(items: T[], pageSize = COMMENTS_PER_PAGE) => {
    const [visibleCount, setVisibleCount] = useState(pageSize);

    useEffect(() => {
        setVisibleCount(pageSize);
    }, [items.length, pageSize]);

    const visibleItems = useMemo(
        () => items.slice(0, visibleCount),
        [items, visibleCount],
    );

    const hasMore = visibleCount < items.length;
    const totalCount = items.length;

    const loadMore = useCallback(() => {
        setVisibleCount(prev => Math.min(prev + pageSize, items.length));
    }, [pageSize, items.length]);

    return {
        visibleItems,
        hasMore,
        totalCount,
        loadMore,
    };
};

export default useCommentPagination;
