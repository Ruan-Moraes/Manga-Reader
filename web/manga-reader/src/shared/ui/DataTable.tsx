import { ReactNode } from 'react';
import { ChevronDown, ChevronUp, RotateCw, Search } from 'lucide-react';

import { Pagination } from '@ui/Pagination';
import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';
import { cn } from '@shared/lib/cn';

export type SortDirection = 'asc' | 'desc';

/** Breakpoint abaixo do qual a coluna some. 'sm' = oculta <640, 'md' = oculta <768. */
export type HideBelow = 'sm' | 'md';

export type Column<T> = {
    key: string;
    header: string;
    render: (item: T) => ReactNode;
    className?: string;
    /** @deprecated usar `hideBelow: 'sm'`. Mantido por compatibilidade. */
    hiddenOnMobile?: boolean;
    hideBelow?: HideBelow;
    sortable?: boolean;
    align?: 'left' | 'right';
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
    emptyTitle?: string;
    onRowClick?: (item: T) => void;
    sortBy?: string;
    sortDirection?: SortDirection;
    onSort?: (key: string, direction: SortDirection) => void;
    selectedKey?: string;
    /** Estado de erro (React Query `isError`): mostra ilustração chibi + retry. */
    isError?: boolean;
    onRetry?: () => void;
    errorTitle?: string;
    errorMessage?: string;
    retryLabel?: string;
    /** Toolbar de busca (aplica no submit/Enter). Renderiza quando `onSearchChange` é passado. */
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    onSearchSubmit?: () => void;
    searchPlaceholder?: string;
    searchButtonLabel?: string;
    /** Conteúdo à direita da toolbar (ex.: botão "Novo", filtro). */
    toolbarRight?: ReactNode;
};

const hideClass = (col: { hideBelow?: HideBelow; hiddenOnMobile?: boolean }): string => {
    if (col.hideBelow === 'md') return 'hidden md:table-cell';
    if (col.hideBelow === 'sm' || col.hiddenOnMobile) return 'hidden sm:table-cell';
    return '';
};

function StateBlock({
    illustration,
    title,
    message,
    action,
}: {
    illustration: 'duvida' | 'zangada';
    title?: string;
    message?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center px-5 py-12 text-center">
            <Illustration type={illustration} className="mb-3.5 size-24 object-contain" />
            {title && <h3 className="mb-1.5 text-mr-h4 font-mr-extrabold text-mr-fg">{title}</h3>}
            {message && <p className="mx-auto mb-4 max-w-[340px] text-mr-small leading-relaxed text-mr-fg-subtle">{message}</p>}
            {action}
        </div>
    );
}

function DataTable<T>({
    columns,
    data,
    keyExtractor,
    page,
    totalPages,
    onPageChange,
    isLoading = false,
    emptyMessage,
    emptyTitle,
    onRowClick,
    sortBy,
    sortDirection,
    onSort,
    selectedKey,
    isError = false,
    onRetry,
    errorTitle,
    errorMessage,
    retryLabel,
    searchValue,
    onSearchChange,
    onSearchSubmit,
    searchPlaceholder,
    searchButtonLabel,
    toolbarRight,
}: DataTableProps<T>) {
    const handleSort = (col: Column<T>) => {
        if (!col.sortable || !onSort) return;

        const newDirection: SortDirection = sortBy === col.key && sortDirection === 'asc' ? 'desc' : 'asc';

        onSort(col.key, newDirection);
    };

    const hasToolbar = Boolean(onSearchChange || toolbarRight);

    const toolbar = hasToolbar && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
            {onSearchChange && (
                <form
                    className="relative flex min-w-[220px] flex-1 items-center"
                    onSubmit={e => {
                        e.preventDefault();
                        onSearchSubmit?.();
                    }}
                >
                    <span className="pointer-events-none absolute left-3 flex text-mr-tertiary">
                        <Search size={16} />
                    </span>
                    <input
                        value={searchValue ?? ''}
                        placeholder={searchPlaceholder}
                        onChange={e => onSearchChange(e.target.value)}
                        className={cn(
                            'h-[42px] w-full rounded-l-mr-xs border border-r-0 border-mr-tertiary bg-mr-primary pl-9 pr-3',
                            'text-mr-body text-mr-fg placeholder:text-mr-tertiary',
                            'transition-colors hover:border-mr-accent-50 focus:border-mr-accent focus:outline-none',
                        )}
                    />
                    <button
                        type="submit"
                        className={cn(
                            'h-[42px] whitespace-nowrap rounded-r-mr-xs border border-mr-tertiary bg-mr-secondary px-[18px]',
                            'text-mr-body font-mr-bold text-mr-fg transition-colors hover:border-mr-accent-50 hover:bg-mr-accent-25',
                        )}
                    >
                        {searchButtonLabel}
                    </button>
                </form>
            )}
            {toolbarRight && <div className="flex flex-wrap items-center gap-2.5">{toolbarRight}</div>}
        </div>
    );

    const tableHead = (
        <thead>
            <tr className="bg-mr-surface-muted">
                {columns.map(col => (
                    <th
                        key={col.key}
                        onClick={() => handleSort(col)}
                        className={cn(
                            'whitespace-nowrap border-b border-mr-border px-4 py-3 text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-fg-subtle',
                            col.align === 'right' ? 'text-right' : 'text-left',
                            hideClass(col),
                            col.className,
                            col.sortable && onSort && 'cursor-pointer select-none transition-colors hover:text-mr-fg',
                        )}
                    >
                        <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'justify-end')}>
                            {col.header}
                            {col.sortable && onSort && sortBy === col.key && (sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </span>
                    </th>
                ))}
            </tr>
        </thead>
    );

    const renderBody = () => {
        if (isError) {
            return (
                <StateBlock
                    illustration="zangada"
                    title={errorTitle}
                    message={errorMessage}
                    action={
                        onRetry && (
                            <Button variant="raised" size="sm" icon={RotateCw} onClick={onRetry}>
                                {retryLabel}
                            </Button>
                        )
                    }
                />
            );
        }

        if (isLoading) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-mr-small">
                        {tableHead}
                        <tbody>
                            {Array.from({ length: 6 }).map((_, r) => (
                                <tr key={r} className="border-b border-mr-gray-900 last:border-b-0">
                                    {columns.map(col => (
                                        <td key={col.key} className={cn('px-4 py-3', hideClass(col))}>
                                            <span className="block h-3.5 animate-mr-pulse rounded-mr-xs bg-mr-gray-800" style={{ width: col.key === 'actions' ? 56 : `${55 + ((r * 7 + col.key.length * 11) % 35)}%` }} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (data.length === 0) {
            return <StateBlock illustration="duvida" title={emptyTitle} message={emptyMessage} />;
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-mr-small">
                    {tableHead}
                    <tbody>
                        {data.map(item => {
                            const itemKey = keyExtractor(item);
                            const isSelected = selectedKey !== undefined && itemKey === selectedKey;

                            return (
                                <tr
                                    key={itemKey}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        'border-b border-mr-gray-900 transition-colors last:border-b-0 hover:bg-mr-surface-muted',
                                        onRowClick && 'cursor-pointer',
                                        isSelected && 'bg-mr-accent-10',
                                    )}
                                >
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={cn('px-4 py-3 align-middle text-mr-fg', col.align === 'right' && 'text-right', hideClass(col), col.className)}
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
        );
    };

    return (
        <div>
            {toolbar}
            <div className="overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface">{renderBody()}</div>
            {!isError && !isLoading && data.length > 0 && totalPages > 1 && (
                <Pagination page={page + 1} total={totalPages} onChange={p => onPageChange(p - 1)} />
            )}
        </div>
    );
}

export default DataTable;
