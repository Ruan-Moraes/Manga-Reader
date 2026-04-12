import { useEffect, useMemo, useState } from 'react';

import { getGroups } from '../service/groupService';
import { GroupStatus, Group } from '../type/group.types';

type GroupFilters = {
    status: 'all' | GroupStatus;
    genre: 'all' | string;
    sortBy: 'popularity' | 'members' | 'titles' | 'rating';
    query?: string;
};

const sortGroups = (groups: Group[], sortBy: GroupFilters['sortBy']) => {
    const sorted = [...groups];

    sorted.sort((a, b) => {
        if (sortBy === 'members') return b.members.length - a.members.length;
        if (sortBy === 'titles') return b.totalTitles - a.totalTitles;
        if (sortBy === 'rating') return b.rating - a.rating;

        return b.popularity - a.popularity;
    });

    return sorted;
};

const useGroups = (filters: GroupFilters) => {
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);

        getGroups(0, 100).then(page => {
            setAllGroups(page.content);
            setIsLoading(false);
        });
    }, []);

    const genres = useMemo(
        () => Array.from(new Set(allGroups.flatMap(g => g.genres))).sort(),
        [allGroups],
    );

    const groups = useMemo(() => {
        const q = filters.query?.toLowerCase().trim() ?? '';

        const filtered = allGroups.filter(group => {
            const statusMatch =
                filters.status === 'all' || group.status === filters.status;
            const genreMatch =
                filters.genre === 'all' || group.genres.includes(filters.genre);
            const queryMatch = !q || group.name.toLowerCase().includes(q);

            return statusMatch && genreMatch && queryMatch;
        });

        return sortGroups(filtered, filters.sortBy);
    }, [
        allGroups,
        filters.genre,
        filters.query,
        filters.sortBy,
        filters.status,
    ]);

    return {
        groups,
        genres,
        isLoading,
    };
};

export default useGroups;
