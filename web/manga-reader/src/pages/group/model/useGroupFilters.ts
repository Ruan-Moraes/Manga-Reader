import { useMemo, useState } from 'react';

import type { Group } from '@entities/group';

export type GroupSortBy = 'followers' | 'chapters' | 'alpha';

const followersOf = (g: Group) => g.supporters?.length ?? 0;
const chaptersOf = (g: Group) => (g.translatedWorks ?? []).reduce((sum, w) => sum + (w.chapters ?? 0), 0);

/**
 * Estado de busca/ordenação dos grupos + lista derivada. Filtra por nome/gênero (case-insensitive)
 * e ordena por seguidores, capítulos traduzidos ou alfabético. Filtragem client-side sobre a lista
 * já carregada pela entidade `group`.
 */
export const useGroupFilters = (groups: Group[]) => {
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<GroupSortBy>('followers');

    const visible = useMemo(() => {
        const q = query.toLowerCase().trim();

        const filtered = groups.filter(g => !q || g.name.toLowerCase().includes(q) || g.genres.some(x => x.toLowerCase().includes(q)));

        return [...filtered].sort((a, b) => {
            if (sortBy === 'followers') return followersOf(b) - followersOf(a);
            if (sortBy === 'chapters') return chaptersOf(b) - chaptersOf(a);

            return a.name.localeCompare(b.name);
        });
    }, [groups, query, sortBy]);

    return { query, setQuery, sortBy, setSortBy, visible };
};

export default useGroupFilters;
