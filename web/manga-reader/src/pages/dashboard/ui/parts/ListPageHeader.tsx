import { Plus, Search } from 'lucide-react';

import { Button } from '@ui/Button';
import { cn } from '@shared/lib/cn';

type ListPageHeaderProps = {
    title: string;
    subtitle?: string;
    count?: string;
    onNew?: () => void;
    newLabel?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onSubmitSearch: () => void;
    searchPlaceholder: string;
    searchButtonLabel: string;
};

/** Cabeçalho padrão das telas de listagem do admin: título + contagem + Novo + busca. */
const ListPageHeader = ({
    title,
    subtitle,
    count,
    onNew,
    newLabel,
    searchValue,
    onSearchChange,
    onSubmitSearch,
    searchPlaceholder,
    searchButtonLabel,
}: ListPageHeaderProps) => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
                <h1 className="text-[26px] font-mr-extrabold leading-tight text-mr-fg md:text-[30px]">{title}</h1>
                {subtitle && <p className="mt-1.5 text-mr-small text-mr-fg-subtle">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
                {count && <span className="text-mr-small text-mr-fg-subtle">{count}</span>}
                {onNew && (
                    <Button variant="primary" size="sm" icon={Plus} onClick={onNew}>
                        {newLabel}
                    </Button>
                )}
            </div>
        </div>

        <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={e => {
                e.preventDefault();
                onSubmitSearch();
            }}
        >
            <div className="relative flex min-w-[220px] flex-1 items-center">
                <span className="pointer-events-none absolute left-3 flex text-mr-tertiary">
                    <Search size={16} />
                </span>
                <input
                    value={searchValue}
                    placeholder={searchPlaceholder}
                    onChange={e => onSearchChange(e.target.value)}
                    className={cn(
                        'h-[42px] w-full rounded-l-mr-xs border border-r-0 border-mr-tertiary bg-mr-primary pl-9 pr-3',
                        'text-mr-body text-mr-fg placeholder:text-mr-tertiary',
                        'transition-colors hover:border-mr-accent-50 focus:border-mr-accent-border focus:outline-none',
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
            </div>
        </form>
    </div>
);

export default ListPageHeader;
