import { cn } from '@shared/lib/cn';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
    value: string;
    label: string;
    icon?: LucideIcon;
    badge?: ReactNode;
    disabled?: boolean;
}

export interface TabsProps {
    items: TabItem[];
    value: string;
    onChange: (value: string) => void;
    variant?: 'underline' | 'pills';
    size?: 'sm' | 'md';
    /** 'horizontal' (padrão) ou 'vertical' (sidebar: ativo com borda-esquerda accent). */
    orientation?: 'horizontal' | 'vertical';
}

export const Tabs = ({ items, value, onChange, variant = 'underline', size = 'md', orientation = 'horizontal' }: TabsProps) => {
    const baseSize = size === 'sm' ? 'h-9 px-3 text-ui-small' : 'h-11 px-4 text-ui-body';

    if (orientation === 'vertical') {
        return (
            <div role="tablist" aria-orientation="vertical" className="flex flex-col gap-1">
                {items.map(it => {
                    const active = it.value === value;
                    const Icon = it.icon;
                    return (
                        <button
                            key={it.value}
                            role="tab"
                            aria-selected={active}
                            aria-disabled={it.disabled || undefined}
                            disabled={it.disabled}
                            onClick={() => onChange(it.value)}
                            className={cn(
                                'inline-flex h-[46px] items-center gap-2 rounded-ui-xs border-l-2 px-3 text-left font-ui-bold transition-colors duration-ui-default',
                                active ? 'border-ui-accent-border bg-ui-accent-10 text-ui-accent-fg' : 'border-transparent text-ui-fg-muted hover:text-ui-fg',
                                it.disabled && 'cursor-not-allowed opacity-ui-disabled',
                            )}
                        >
                            {Icon && <Icon className="size-4" />}
                            <span className="flex-1">{it.label}</span>
                            {it.badge}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-ui-border-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map(it => {
                const active = it.value === value;
                const Icon = it.icon;
                return (
                    <button
                        key={it.value}
                        role="tab"
                        aria-selected={active}
                        aria-disabled={it.disabled || undefined}
                        disabled={it.disabled}
                        onClick={() => onChange(it.value)}
                        className={cn(
                            'inline-flex shrink-0 items-center gap-2 font-ui-bold transition-colors duration-ui-default',
                            baseSize,
                            variant === 'underline'
                                ? active
                                    ? 'border-b-2 border-ui-accent-border text-ui-fg'
                                    : 'border-b-2 border-transparent text-ui-fg-muted hover:text-ui-fg'
                                : active
                                  ? 'rounded-ui-xs bg-ui-accent text-ui-on-accent'
                                  : 'rounded-ui-xs border border-ui-tertiary text-ui-fg hover:border-ui-accent-border hover:text-ui-accent-fg',
                            it.disabled && 'cursor-not-allowed opacity-ui-disabled',
                        )}
                    >
                        {Icon && <Icon className="size-4" />}
                        <span>{it.label}</span>
                        {it.badge}
                    </button>
                );
            })}
        </div>
    );
};

export default Tabs;
