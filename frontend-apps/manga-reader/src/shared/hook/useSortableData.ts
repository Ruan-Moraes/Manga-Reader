import { useMemo, useState } from 'react';

import type { SortDirection } from '@shared/component/table/DataTable';

type UseSortableDataReturn<T> = {
    sortedData: T[];
    sortBy: string;
    sortDirection: SortDirection;
    handleSort: (key: string, direction: SortDirection) => void;
};

function useSortableData<T>(
    data: T[],
    defaultSortKey = '',
    defaultDirection: SortDirection = 'asc',
): UseSortableDataReturn<T> {
    const [sortBy, setSortBy] = useState(defaultSortKey);
    const [sortDirection, setSortDirection] =
        useState<SortDirection>(defaultDirection);

    const sortedData = useMemo(() => {
        if (!sortBy) return data;

        return [...data].sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortBy];
            const bVal = (b as Record<string, unknown>)[sortBy];

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            let comparison = 0;

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                comparison = Number(aVal) - Number(bVal);
            } else {
                comparison = String(aVal).localeCompare(String(bVal), 'pt-BR', {
                    sensitivity: 'base',
                });
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortBy, sortDirection]);

    const handleSort = (key: string, direction: SortDirection) => {
        setSortBy(key);
        setSortDirection(direction);
    };

    return { sortedData, sortBy, sortDirection, handleSort };
}

export default useSortableData;
