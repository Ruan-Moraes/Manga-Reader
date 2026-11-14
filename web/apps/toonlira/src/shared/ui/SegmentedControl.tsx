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
          ? 'h-8 px-2 text-ui-tiny'
          : 'h-11 px-3 text-ui-small';

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
                                'inline-flex items-center justify-center gap-1.5 border font-ui-bold transition-all duration-ui-default cursor-pointer',
                                isFirst && 'rounded-l-ui-xs',
                                isLast && 'rounded-r-ui-xs',
                                baseSize,
                                block && 'flex-1',
                                active
                                    ? 'border-ui-accent-border bg-ui-accent text-ui-on-accent'
                                    : 'border-ui-tertiary bg-transparent text-ui-fg-muted hover:border-ui-accent-border hover:text-ui-accent-fg',
                                it.disabled && 'cursor-not-allowed opacity-ui-disabled',
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
            <div role="radiogroup" className={cn('inline-flex gap-[3px] rounded-ui-xs border border-ui-gray-700 bg-ui-primary p-[3px]', block && 'w-full', className)}>
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
                                'inline-flex items-center justify-center gap-1.5 rounded-ui-xs font-ui-bold transition-all duration-ui-default cursor-pointer',
                                baseSize,
                                block && 'flex-1',
                                active
                                    ? 'bg-ui-accent-25 text-ui-accent-fg shadow-[inset_0_0_0_1px_var(--ui-accent-50)]'
                                    : 'bg-transparent text-ui-fg-muted hover:bg-ui-secondary',
                                it.disabled && 'cursor-not-allowed opacity-ui-disabled',
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
                            'inline-flex items-center justify-center gap-1.5 border font-ui-bold transition-all duration-ui-default cursor-pointer',
                            isFirst && 'rounded-l-ui-xs',
                            isLast && 'rounded-r-ui-xs',
                            baseSize,
                            block && 'flex-1',
                            active
                                ? 'border-ui-accent-border bg-ui-accent text-ui-on-accent'
                                : 'border-ui-tertiary bg-transparent text-ui-fg-muted hover:border-ui-accent-border hover:text-ui-accent-fg',
                            it.disabled && 'cursor-not-allowed opacity-ui-disabled',
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
