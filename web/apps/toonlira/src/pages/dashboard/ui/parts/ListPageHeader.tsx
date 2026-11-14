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
                <h1 className="text-[26px] font-ui-extrabold leading-tight text-ui-fg md:text-[30px]">{title}</h1>
                {subtitle && <p className="mt-1.5 text-ui-small text-ui-fg-subtle">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
                {count && <span className="text-ui-small text-ui-fg-subtle">{count}</span>}
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
                <span className="pointer-events-none absolute left-3 flex text-ui-tertiary">
                    <Search size={16} />
                </span>
                <input
                    value={searchValue}
                    placeholder={searchPlaceholder}
                    onChange={e => onSearchChange(e.target.value)}
                    className={cn(
                        'h-[42px] w-full rounded-l-ui-xs border border-r-0 border-ui-tertiary bg-ui-primary pl-9 pr-3',
                        'text-ui-body text-ui-fg placeholder:text-ui-tertiary',
                        'transition-colors hover:border-ui-accent-50 focus:border-ui-accent-border focus:outline-none',
                    )}
                />
                <button
                    type="submit"
                    className={cn(
                        'h-[42px] whitespace-nowrap rounded-r-ui-xs border border-ui-tertiary bg-ui-secondary px-[18px]',
                        'text-ui-body font-ui-bold text-ui-fg transition-colors hover:border-ui-accent-50 hover:bg-ui-accent-25',
                    )}
                >
                    {searchButtonLabel}
                </button>
            </div>
        </form>
    </div>
);

export default ListPageHeader;
