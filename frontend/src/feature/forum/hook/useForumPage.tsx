import { useCallback, useMemo, useState } from 'react';
import {
    filterForumTopics,
    paginateTopics,
    type ForumCategory,
    type ForumSort,
} from '@feature/forum';

const useForumPage = () => {
    const [activeCategory, setActiveCategory] = useState<'all' | ForumCategory>(
        'all',
    );
    const [sort, setSort] = useState<ForumSort>('recent');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);

    const allTopics = useMemo(
        () => filterForumTopics({ category: activeCategory, sort, query }),
        [activeCategory, sort, query],
    );

    const { items: topics, totalPages } = useMemo(
        () => paginateTopics(allTopics, page),
        [allTopics, page],
    );

    const updateCategory = useCallback((cat: 'all' | ForumCategory) => {
        setActiveCategory(cat);
        setPage(1);
    }, []);

    const updateSort = useCallback((s: ForumSort) => {
        setSort(s);
        setPage(1);
    }, []);

    const updateQuery = useCallback((q: string) => {
        setQuery(q);
        setPage(1);
    }, []);

    return {
        activeCategory,
        sort,
        query,
        page,
        setPage,
        allTopics,
        topics,
        totalPages,
        updateCategory,
        updateSort,
        updateQuery,
    };
};

export default useForumPage;
