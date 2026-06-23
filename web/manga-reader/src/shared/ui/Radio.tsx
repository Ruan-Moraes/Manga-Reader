import { useId } from 'react';

import { cn } from '@shared/lib/cn';

export interface RadioOption {
    value: string;
    label: string;
    hint?: string;
    disabled?: boolean;
    /** Tag pill exibida à direita (ex.: 'Em breve') no variant 'card'. */
    badge?: string;
}

export interface RadioGroupProps {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    options: RadioOption[];
    layout?: 'vertical' | 'horizontal';
    legend?: string;
    /** 'plain' (padrão) = radios nativos · 'card' = linhas-card com seleção accent. */
    variant?: 'plain' | 'card';
}

export const RadioGroup = ({ name, value, onChange, options, layout = 'vertical', legend, variant = 'plain' }: RadioGroupProps) => {
    const baseId = useId();

    if (variant === 'card') {
        return (
            <fieldset className={cn('m-0 border-none p-0', layout === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2')}>
                {legend && <legend className="mr-label mb-2">{legend}</legend>}
                {options.map(o => {
                    const id = `${baseId}-${o.value}`;
                    const active = value === o.value;

                    return (
                        <label
                            key={o.value}
                            htmlFor={id}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-mr-xs border bg-mr-secondary px-3 py-2.5 transition-all duration-mr-default',
                                active ? 'border-mr-accent' : 'border-mr-gray-800 hover:border-mr-accent-50',
                                o.disabled && 'cursor-not-allowed opacity-50 hover:border-mr-gray-800',
                                layout === 'horizontal' && 'flex-1',
                            )}
                        >
                            <input
                                id={id}
                                type="radio"
                                name={name}
                                value={o.value}
                                checked={active}
                                disabled={o.disabled}
                                onChange={() => onChange?.(o.value)}
                                className="sr-only"
                            />
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'grid size-[18px] shrink-0 place-items-center rounded-mr-full border transition-colors duration-mr-default',
                                    active ? 'border-mr-accent' : 'border-mr-tertiary',
                                )}
                            >
                                {active && <span className="size-2 rounded-mr-full bg-mr-accent" />}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="text-mr-body text-mr-fg">{o.label}</span>
                                {o.hint && <span className="text-mr-tiny text-mr-fg-subtle">{o.hint}</span>}
                            </span>
                            {o.badge && (
                                <span className="shrink-0 rounded-mr-full bg-mr-gray-800 px-2 py-0.5 text-[10px] font-mr-bold uppercase tracking-mr-label text-mr-fg-subtle">
                                    {o.badge}
                                </span>
                            )}
                        </label>
                    );
                })}
            </fieldset>
        );
    }

    return (
        <fieldset className={`border-none p-0 m-0 ${layout === 'vertical' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-4'}`}>
            {legend && <legend className="mr-label mb-2">{legend}</legend>}
            {options.map(o => {
                const id = `${baseId}-${o.value}`;
                return (
                    <label
                        key={o.value}
                        htmlFor={id}
                        className={`flex cursor-pointer items-start gap-2 text-mr-body ${o.disabled ? 'cursor-not-allowed opacity-mr-disabled' : ''}`}
                    >
                        <input
                            id={id}
                            type="radio"
                            name={name}
                            value={o.value}
                            checked={value === o.value}
                            disabled={o.disabled}
                            onChange={() => onChange?.(o.value)}
                            className="mt-0.5 size-4 shrink-0 cursor-pointer"
                            style={{ accentColor: 'var(--mr-accent)' }}
                        />
                        <span className="flex flex-col">
                            <span className="text-mr-fg">{o.label}</span>
                            {o.hint && <span className="text-mr-tiny text-mr-fg-subtle">{o.hint}</span>}
                        </span>
                    </label>
                );
            })}
        </fieldset>
    );
};

export default RadioGroup;
