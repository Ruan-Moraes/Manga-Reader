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
    /** 'solid' (padrão) = ativo preenchido accent · 'soft' = track + ativo translúcido. */
    tone?: 'solid' | 'soft';
    /** Exibe apenas o ícone (label vira texto acessível via sr-only). Requer `icon` em todos os items. */
    iconOnly?: boolean;
    className?: string;
}

export const SegmentedControl = ({ items, value, onChange, size = 'md', block, unified, tone = 'solid', iconOnly, className }: SegmentedControlProps) => {
    const baseSize = iconOnly
        ? size === 'sm'
            ? 'h-8 w-8'
            : 'h-11 w-11'
        : size === 'sm'
          ? 'h-8 px-2 text-mr-tiny'
          : 'h-11 px-3 text-mr-small';

    if (unified) {
        return (
            <div role="radiogroup" className={cn('inline-flex', block && 'w-full', className)}>
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
                            title={iconOnly ? it.label : undefined}
                            className={cn(
                                'inline-flex items-center justify-center gap-1.5 border font-mr-bold transition-all duration-mr-default cursor-pointer',
                                isFirst && 'rounded-l-mr-xs',
                                isLast && 'rounded-r-mr-xs',
                                baseSize,
                                block && 'flex-1',
                                active
                                    ? 'border-mr-accent-border bg-mr-accent text-mr-on-accent'
                                    : 'border-mr-tertiary bg-transparent text-mr-fg-muted hover:border-mr-accent-border hover:text-mr-accent-fg',
                                it.disabled && 'cursor-not-allowed opacity-mr-disabled',
                            )}
                        >
                            {Icon && <Icon className="size-3.5" />}
                            <span className={iconOnly ? 'sr-only' : undefined}>{it.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (tone === 'soft') {
        return (
            <div role="radiogroup" className={cn('inline-flex gap-[3px] rounded-mr-xs border border-mr-gray-700 bg-mr-primary p-[3px]', block && 'w-full', className)}>
                {items.map(it => {
                    const active = it.value === value;
                    const Icon = it.icon;

                    return (
                        <button
                            key={it.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={it.disabled}
                            onClick={() => onChange(it.value)}
                            title={iconOnly ? it.label : undefined}
                            className={cn(
                                'inline-flex items-center justify-center gap-1.5 rounded-mr-xs font-mr-bold transition-all duration-mr-default cursor-pointer',
                                baseSize,
                                block && 'flex-1',
                                active
                                    ? 'bg-mr-accent-25 text-mr-accent-fg shadow-[inset_0_0_0_1px_var(--mr-accent-50)]'
                                    : 'bg-transparent text-mr-fg-muted hover:bg-mr-secondary',
                                it.disabled && 'cursor-not-allowed opacity-mr-disabled',
                            )}
                        >
                            {Icon && <Icon className="size-3.5" />}
                            <span className={iconOnly ? 'sr-only' : undefined}>{it.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div role="radiogroup" className={cn('inline-flex gap-1', block && 'w-full', className)}>
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
                        title={iconOnly ? it.label : undefined}
                        className={cn(
                            'inline-flex items-center justify-center gap-1.5 border font-mr-bold transition-all duration-mr-default cursor-pointer',
                            isFirst && 'rounded-l-mr-xs',
                            isLast && 'rounded-r-mr-xs',
                            baseSize,
                            block && 'flex-1',
                            active
                                ? 'border-mr-accent-border bg-mr-accent text-mr-on-accent'
                                : 'border-mr-tertiary bg-transparent text-mr-fg-muted hover:border-mr-accent-border hover:text-mr-accent-fg',
                            it.disabled && 'cursor-not-allowed opacity-mr-disabled',
                        )}
                    >
                        {Icon && <Icon className="size-3.5" />}
                        <span className={iconOnly ? 'sr-only' : undefined}>{it.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SegmentedControl;
