import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';

import { useDebouncedValue } from '@shared/hook/useDebouncedValue';
import { cn } from '@shared/lib/cn';

type EntitySearchSelectProps<T> = {
    queryKey: string;
    fetcher: (term: string) => Promise<T[]>;
    getKey: (item: T) => string | number;
    getLabel: (item: T) => string;
    onPick: (item: T) => void;
    placeholder: string;
    /** Chaves já selecionadas — removidas dos resultados. */
    excludeKeys?: (string | number)[];
    emptyLabel: string;
};

/** Busca typeahead (debounced) que dispara `onPick` ao selecionar um resultado. */
function EntitySearchSelect<T>({ queryKey, fetcher, getKey, getLabel, onPick, placeholder, excludeKeys = [], emptyLabel }: EntitySearchSelectProps<T>) {
    const [term, setTerm] = useState('');
    const [open, setOpen] = useState(false);
    const debounced = useDebouncedValue(term.trim(), 300);

    const { data = [], isFetching } = useQuery({
        queryKey: [queryKey, debounced],
        queryFn: () => fetcher(debounced),
        enabled: open && debounced.length >= 1,
        staleTime: 30_000,
    });

    const results = data.filter(item => !excludeKeys.includes(getKey(item)));

    const pick = (item: T) => {
        onPick(item);
        setTerm('');
        setOpen(false);
    };

    return (
        <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-mr-tertiary">
                <Search size={16} />
            </span>
            <input
                value={term}
                placeholder={placeholder}
                onChange={e => {
                    setTerm(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                className={cn(
                    'h-[42px] w-full rounded-mr-xs border border-mr-tertiary bg-mr-primary pl-9 pr-3 text-mr-body text-mr-fg',
                    'placeholder:text-mr-tertiary transition-colors hover:border-mr-accent-50 focus:border-mr-accent focus:outline-none',
                )}
            />
            {open && debounced.length >= 1 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-mr-xs border border-mr-border bg-mr-surface shadow-mr-black">
                    {isFetching && <li className="px-3 py-2 text-mr-small text-mr-fg-subtle">…</li>}
                    {!isFetching && results.length === 0 && <li className="px-3 py-2 text-mr-small text-mr-fg-subtle">{emptyLabel}</li>}
                    {results.map(item => (
                        <li key={getKey(item)}>
                            <button
                                type="button"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => pick(item)}
                                className="block w-full px-3 py-2 text-left text-mr-small text-mr-fg transition-colors hover:bg-mr-accent-25 hover:text-mr-accent"
                            >
                                {getLabel(item)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default EntitySearchSelect;
