import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

import { useDebouncedValue } from '@shared/hook/useDebouncedValue';
import { useFloatingPortalContainer } from '@ui/FloatingPortalContext';
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

/**
 * Busca typeahead (debounced) que dispara `onPick` ao selecionar um resultado.
 * A lista é ancorada via Popover portalado — dentro de um Modal (<dialog> na
 * top layer) portala para o próprio dialog, sem cortes de overflow.
 */
function EntitySearchSelect<T>({ queryKey, fetcher, getKey, getLabel, onPick, placeholder, excludeKeys = [], emptyLabel }: EntitySearchSelectProps<T>) {
    const [term, setTerm] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounced = useDebouncedValue(term.trim(), 300);
    const portalContainer = useFloatingPortalContainer();
    const listboxId = useId();

    const { data = [], isFetching } = useQuery({
        queryKey: [queryKey, debounced],
        queryFn: () => fetcher(debounced),
        enabled: open && debounced.length >= 1,
        staleTime: 30_000,
    });

    const results = data.filter(item => !excludeKeys.includes(getKey(item)));
    const expanded = open && debounced.length >= 1;

    const pick = (item: T) => {
        onPick(item);
        setTerm('');
        setOpen(false);
        setActiveIndex(-1);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (!expanded || results.length === 0) {
            if (e.key === 'Escape' && open) {
                // preventDefault impede o `cancel` nativo do <dialog>; fecha só a lista.
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
            }

            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => (i <= 0 ? results.length - 1 : i - 1));
        } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < results.length) {
            e.preventDefault();
            pick(results[activeIndex]);
        } else if (e.key === 'Escape') {
            // Fecha só a lista — preventDefault impede o `cancel` nativo do <dialog> (fecharia o Modal junto).
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
            setActiveIndex(-1);
        }
    };

    return (
        <Popover.Root open={expanded}>
            <Popover.Anchor asChild>
                <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-ui-tertiary">
                        <Search size={16} />
                    </span>
                    <input
                        value={term}
                        placeholder={placeholder}
                        role="combobox"
                        aria-expanded={expanded}
                        aria-controls={expanded ? listboxId : undefined}
                        aria-autocomplete="list"
                        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
                        onChange={e => {
                            setTerm(e.target.value);
                            setOpen(true);
                            setActiveIndex(-1);
                        }}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        onKeyDown={onKeyDown}
                        className={cn(
                            'h-11 w-full rounded-ui-sm bg-ui-primary pl-9 pr-3 text-ui-body text-ui-fg',
                            'placeholder:text-ui-tertiary transition-[background-color,box-shadow] duration-ui-fast outline-none',
                            'hover:bg-ui-surface-muted focus:bg-ui-surface-muted focus:ring-2 focus:ring-ui-accent-25',
                        )}
                    />
                </div>
            </Popover.Anchor>
            {expanded && (
                <Popover.Portal container={portalContainer ?? undefined}>
                    <Popover.Content
                        side="bottom"
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={e => e.preventDefault()}
                        onCloseAutoFocus={e => e.preventDefault()}
                        style={{ width: 'var(--radix-popover-trigger-width)' }}
                        className="z-ui-dropdown animate-ui-fade-in"
                    >
                        <ul
                            id={listboxId}
                            role="listbox"
                            className="max-h-56 overflow-y-auto rounded-ui-md bg-ui-surface-elevated p-1.5 shadow-ui-elevated"
                        >
                            {isFetching && <li className="px-3 py-2 text-ui-small text-ui-fg-subtle">…</li>}
                            {!isFetching && results.length === 0 && <li className="px-3 py-2 text-ui-small text-ui-fg-subtle">{emptyLabel}</li>}
                            {results.map((item, index) => (
                                <li key={getKey(item)} id={`${listboxId}-${index}`} role="option" aria-selected={index === activeIndex}>
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => pick(item)}
                                        className={cn(
                                            'flex h-10 w-full items-center rounded-ui-sm px-3 text-left text-ui-body text-ui-fg transition-colors hover:bg-ui-accent-25 hover:text-ui-accent-fg',
                                            index === activeIndex && 'bg-ui-accent-25 text-ui-accent-fg',
                                        )}
                                    >
                                        {getLabel(item)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Popover.Content>
                </Popover.Portal>
            )}
        </Popover.Root>
    );
}

export default EntitySearchSelect;
