import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface SegmentItem {
    value: string;
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
}

export interface SegmentedControlProps {
    items: SegmentItem[];
    value: string;
    onChange: (value: string) => void;
    size?: 'sm' | 'md';
    block?: boolean;
    unified?: boolean;
}

export const SegmentedControl = ({ items, value, onChange, size = 'md', block, unified }: SegmentedControlProps) => {
    const baseSize = size === 'sm' ? 'h-8 px-2 text-mr-tiny' : 'h-11 px-3 text-mr-small';

    if (unified) {
        return (
            <div role="radiogroup" className={cn('inline-flex', block && 'w-full')}>
                {items.map((it, index, items) => {
                    const active = it.value === value;

                    const isFirst = index === 0;
                    const isLast = index === items.length - 1;

                    const Icon = it.icon;

                    return (
                        <button
                            key={it.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={it.disabled}
                            onClick={() => onChange(it.value)}
                            className={cn(
                                'inline-flex items-center justify-center gap-1.5 border font-mr-bold transition-all duration-mr-default cursor-pointer',
                                isFirst && 'rounded-l-mr-xs',
                                isLast && 'rounded-r-mr-xs',
                                baseSize,
                                block && 'flex-1',
                                active
                                    ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                    : 'border-mr-tertiary bg-transparent text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
                                it.disabled && 'cursor-not-allowed opacity-mr-disabled',
                            )}
                        >
                            {Icon && <Icon className="size-3.5" />}
                            <span>{it.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div role="radiogroup" className={cn('inline-flex gap-1', block && 'w-full')}>
            {items.map((it, index, items) => {
                const active = it.value === value;

                const isFirst = index === 0;
                const isLast = index === items.length - 1;

                const Icon = it.icon;

                return (
                    <button
                        key={it.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={it.disabled}
                        onClick={() => onChange(it.value)}
                        className={cn(
                            'inline-flex items-center justify-center gap-1.5 border font-mr-bold transition-all duration-mr-default cursor-pointer',
                            isFirst && 'rounded-l-mr-xs',
                            isLast && 'rounded-r-mr-xs',
                            baseSize,
                            block && 'flex-1',
                            active
                                ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                : 'border-mr-tertiary bg-transparent text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
                            it.disabled && 'cursor-not-allowed opacity-mr-disabled',
                        )}
                    >
                        {Icon && <Icon className="size-3.5" />}
                        <span>{it.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedControl;
