import { useMemo, useState } from 'react';

import { filterAndSortTopics, type ForumTab } from '../ui/forumData';

/**
 * Estado de seleção do feed do fórum (categoria + aba) e a lista de tópicos derivada
 * via `filterAndSortTopics`. Mantém a page livre de lógica de filtro/ordenação.
 */
export const useForumFilters = () => {
    const [category, setCategory] = useState('home');
    const [tab, setTab] = useState<ForumTab>('alta');

    const topics = useMemo(() => filterAndSortTopics(category, tab), [category, tab]);

    return { category, setCategory, tab, setTab, topics };
};

export default useForumFilters;
