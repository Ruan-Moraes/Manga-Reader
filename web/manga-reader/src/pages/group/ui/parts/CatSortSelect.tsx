import { useState } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

import * as RD from '@radix-ui/react-dropdown-menu';
import { cn } from '@shared/lib/cn';
import { useFloatingPortalContainer } from '@ui/FloatingPortalContext';

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
    const portalContainer = useFloatingPortalContainer();

    const cur = options.find(o => o.key === value) ?? options[0];
    const CurIcon = cur.icon;

    return (
        <RD.Root open={open} onOpenChange={setOpen}>
            <RD.Trigger asChild>
                <button
                    type="button"
                    className={cn(
                        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-mr-xs border bg-mr-secondary px-3 text-mr-small font-mr-bold text-mr-fg tracking-mr cursor-pointer mr-focus-ring',
                        open ? 'border-mr-accent-border' : 'border-mr-gray-700',
                    )}
                >
                    <CurIcon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    <span>{cur.label}</span>
                    <ChevronDown className="size-3" strokeWidth={2} aria-hidden="true" />
                </button>
            </RD.Trigger>

            <RD.Portal container={portalContainer ?? undefined}>
                <RD.Content
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    style={{ zIndex: 'var(--z-index-mr-dropdown)' }}
                    className="min-w-[200px] overflow-hidden rounded-mr-xs border border-mr-gray-700 bg-mr-primary shadow-mr-elevated"
                >
                    {options.map(o => {
                        const Icon = o.icon;
                        const active = o.key === value;
                        return (
                            <RD.Item
                                key={o.key}
                                onSelect={() => onChange(o.key)}
                                className={cn(
                                    'flex w-full items-center gap-2 border-l-2 px-3 py-2.5 text-left text-mr-small font-mr-semibold tracking-mr cursor-pointer outline-none',
                                    active ? 'border-mr-accent-border bg-mr-accent-10 text-mr-accent-fg' : 'border-transparent text-mr-fg hover:bg-mr-accent-10',
                                )}
                            >
                                <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                                {o.label}
                            </RD.Item>
                        );
                    })}
                </RD.Content>
            </RD.Portal>
        </RD.Root>
    );
};
