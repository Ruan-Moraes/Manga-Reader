import { ReactNode } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

import Pagination from '@shared/component/navigation/Pagination';

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
    hiddenOnMobile?: boolean;
    sortable?: boolean;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    sortBy?: string;
    sortDirection?: SortDirection;
    onSort?: (key: string, direction: SortDirection) => void;
    selectedKey?: string;
};

function DataTable<T>({
    columns,
    data,
    keyExtractor,
    page,
    totalPages,
    onPageChange,
    isLoading = false,
    emptyMessage = 'Nenhum resultado encontrado.',
    onRowClick,
    sortBy,
    sortDirection,
    onSort,
    selectedKey,
}: DataTableProps<T>) {
    const handleSort = (col: Column<T>) => {
        if (!col.sortable || !onSort) return;

        const newDirection: SortDirection =
            sortBy === col.key && sortDirection === 'asc' ? 'desc' : 'asc';

        onSort(col.key, newDirection);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-12 rounded-xs bg-tertiary/30 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <p className="py-8 text-sm text-center text-tertiary">
                {emptyMessage}
            </p>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto border rounded-xs border-tertiary">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-secondary border-b-tertiary">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col)}
                                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''} ${col.className ?? ''} ${col.sortable && onSort ? 'cursor-pointer select-none hover:text-white transition-colors' : ''}`}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.header}
                                        {col.sortable &&
                                            onSort &&
                                            sortBy === col.key &&
                                            (sortDirection === 'asc' ? (
                                                <FiChevronUp size={12} />
                                            ) : (
                                                <FiChevronDown size={12} />
                                            ))}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => {
                            const itemKey = keyExtractor(item);
                            const isSelected =
                                selectedKey !== undefined &&
                                itemKey === selectedKey;

                            return (
                                <tr
                                    key={itemKey}
                                    onClick={() => onRowClick?.(item)}
                                    className={`border-b border-b-tertiary/50 transition-colors hover:bg-tertiary/15 active:bg-tertiary/30 ${
                                        onRowClick ? 'cursor-pointer' : ''
                                    } ${isSelected ? 'bg-quaternary-opacity-25' : ''}`}
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={`px-4 py-3 ${col.hiddenOnMobile ? 'hidden sm:table-cell' : ''} ${col.className ?? ''}`}
                                        >
                                            {col.render(item)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination
                page={page + 1}
                totalPages={totalPages}
                onPageChange={p => onPageChange(p - 1)}
            />
        </div>
    );
}

export default DataTable;
