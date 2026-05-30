import { cn } from '@/lib/cn';

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
}

export const Tabs = ({ items, value, onChange, variant = 'underline', size = 'md' }: TabsProps) => {
    const baseSize = size === 'sm' ? 'h-9 px-3 text-mr-small' : 'h-11 px-4 text-mr-body';

    return (
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-mr-border-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                            'inline-flex shrink-0 items-center gap-2 font-mr-bold transition-colors duration-mr-default',
                            baseSize,
                            variant === 'underline'
                                ? active
                                    ? 'border-b-2 border-mr-accent text-mr-fg'
                                    : 'border-b-2 border-transparent text-mr-fg-muted hover:text-mr-fg'
                                : active
                                  ? 'rounded-mr-xs bg-mr-accent text-mr-primary'
                                  : 'rounded-mr-xs border border-mr-tertiary text-mr-fg hover:border-mr-accent hover:text-mr-accent',
                            it.disabled && 'cursor-not-allowed opacity-mr-disabled',
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
