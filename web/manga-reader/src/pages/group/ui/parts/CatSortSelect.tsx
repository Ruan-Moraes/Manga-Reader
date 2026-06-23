import { useEffect, useRef, useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface SortOption<T extends string> {
    key: T;
    label: string;
    icon: LucideIcon;
}

interface CatSortSelectProps<T extends string> {
    value: T;
    options: SortOption<T>[];
    onChange: (value: T) => void;
}

/** Dropdown de ordenação — espelha o CatSortSelect do handoff (sombra-assinatura, item ativo accent + border-left). */
export const CatSortSelect = <T extends string>({ value, options, onChange }: CatSortSelectProps<T>) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const cur = options.find(o => o.key === value) ?? options[0];
    const CurIcon = cur.icon;

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={cn(
                    'inline-flex h-10 items-center gap-1.5 rounded-mr-xs border bg-mr-secondary px-3 text-mr-small font-mr-bold text-mr-fg tracking-mr cursor-pointer mr-focus-ring',
                    open ? 'border-mr-accent' : 'border-mr-gray-700',
                )}
            >
                <CurIcon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                <span>{cur.label}</span>
                <ChevronDown className="size-3" strokeWidth={2} aria-hidden="true" />
            </button>

            {open && (
                <div role="listbox" className="absolute right-0 top-[calc(100%+4px)] z-mr-dropdown min-w-[200px] overflow-hidden rounded-mr-xs border border-mr-gray-700 bg-mr-primary shadow-mr-elevated">
                    {options.map(o => {
                        const Icon = o.icon;
                        const active = o.key === value;
                        return (
                            <button
                                key={o.key}
                                type="button"
                                role="option"
                                aria-selected={active}
                                onClick={() => {
                                    onChange(o.key);
                                    setOpen(false);
                                }}
                                className={cn(
                                    'flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left text-mr-small font-mr-semibold tracking-mr cursor-pointer',
                                    active ? 'border-mr-accent bg-mr-accent-10 text-mr-accent' : 'border-transparent text-mr-fg hover:bg-mr-accent-10',
                                )}
                            >
                                <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
