import { ReactNode } from 'react';

import Pagination from '@shared/component/navigation/Pagination';

export type Column<T> = {
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
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
}: DataTableProps<T>) {
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
                                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-tertiary ${col.className ?? ''}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`border-b border-b-tertiary/50 transition-colors ${
                                    onRowClick
                                        ? 'cursor-pointer hover:bg-tertiary/20'
                                        : ''
                                }`}
                            >
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-3 ${col.className ?? ''}`}
                                    >
                                        {col.render(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
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
