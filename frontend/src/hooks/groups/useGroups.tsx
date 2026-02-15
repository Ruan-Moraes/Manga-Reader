import { useEffect, useMemo, useState } from 'react';

import { getAllGenres, mockGroups } from '../../services/mock/mockGroupService';
import { GroupStatus, GroupTypes } from '../../types/GroupTypes';

type GroupFilters = {
    status: 'all' | GroupStatus;
    genre: 'all' | string;
    sortBy: 'popularity' | 'members' | 'titles' | 'rating';
};

const sortGroups = (groups: GroupTypes[], sortBy: GroupFilters['sortBy']) => {
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
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        setIsLoading(true);

        const timeout = setTimeout(() => setIsLoading(false), 300);

        return () => clearTimeout(timeout);
    }, [filters.genre, filters.sortBy, filters.status]);

    const groups = useMemo(() => {
        const filtered = mockGroups.filter(group => {
            const statusMatch =
                filters.status === 'all' || group.status === filters.status;
            const genreMatch =
                filters.genre === 'all' || group.genres.includes(filters.genre);

            return statusMatch && genreMatch;
        });

        return sortGroups(filtered, filters.sortBy);
    }, [filters.genre, filters.sortBy, filters.status]);

    return {
        groups,
        genres: getAllGenres(),
        isLoading,
    };
};

export default useGroups;
