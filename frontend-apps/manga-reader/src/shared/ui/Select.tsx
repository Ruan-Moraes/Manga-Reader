import type { SelectHTMLAttributes } from 'react';
import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import * as RD from '@radix-ui/react-dropdown-menu';

import { cn } from '@shared/lib/cn';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { options, placeholder, error, hint, disabled, className, id, value, onChange, 'aria-label': ariaLabel, ...rest },
    ref,
) {
    const describedBy = hint || error ? `${id ?? 'select'}-hint` : undefined;
    const internalRef = useRef<HTMLSelectElement>(null);

    useImperativeHandle(ref, () => internalRef.current!);

    const selectedOption = useMemo(() => options.find(o => String(o.value) === String(value)), [options, value]);
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    const handleSelect = (val: string) => {
        if (internalRef.current) {
            // Mudança programática do valor para garantir que o evento de mudança seja disparado
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;

            nativeInputValueSetter?.call(internalRef.current, val);

            const event = new Event('change', { bubbles: true });

            internalRef.current.dispatchEvent(event);

            // Chamar o onChange se fornecido (importante para react-hook-form)
            if (onChange) {
                const changeEvent = {
                    target: internalRef.current,
                    currentTarget: internalRef.current,
                } as unknown as React.ChangeEvent<HTMLSelectElement>;

                onChange(changeEvent);
            }
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <RD.Root>
                <RD.Trigger asChild>
                    <button
                        type="button"
                        role="combobox"
                        id={id}
                        disabled={disabled}
                        className={cn(
                            'relative flex h-11 w-full items-center rounded-mr-xs border bg-mr-primary px-3 pr-9 text-left text-mr-body text-mr-fg transition-all duration-mr-default outline-none',
                            'focus-visible:border-mr-accent hover:not(:disabled):border-mr-accent-50 data-[state=open]:border-mr-accent',
                            error ? 'border-mr-danger' : 'border-mr-tertiary',
                            disabled && 'opacity-mr-disabled cursor-not-allowed',
                            className,
                        )}
                        aria-invalid={!!error || undefined}
                        aria-describedby={describedBy}
                        aria-label={ariaLabel ?? (typeof displayLabel === 'string' && displayLabel ? displayLabel : undefined)}
                    >
                        <span className={cn('block truncate', !selectedOption && 'text-mr-fg-muted')}>{displayLabel}</span>
                        <ChevronDown className="pointer-events-none absolute right-3 size-4 text-mr-tertiary transition-transform duration-mr-default data-[state=open]:rotate-180" />
                    </button>
                </RD.Trigger>

                <RD.Portal>
                    <RD.Content
                        align="start"
                        sideOffset={4}
                        className="z-mr-dropdown flex flex-col gap-y-1 min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-72 overflow-y-auto rounded-mr-sm border border-mr-border bg-mr-gray-900 p-1 shadow-mr-default animate-mr-fade-in"
                    >
                        {options.map(o => (
                            <RD.Item
                                key={o.value}
                                disabled={o.disabled}
                                onSelect={() => handleSelect(o.value)}
                                className={cn(
                                    'flex h-10 cursor-pointer items-center gap-2 rounded-mr-xs px-3 text-mr-body outline-none transition-colors',
                                    'data-[highlighted]:bg-mr-accent-25 data-[highlighted]:text-mr-fg',
                                    String(o.value) === String(value) ? 'bg-mr-accent text-mr-primary font-mr-bold' : 'text-mr-fg',
                                    o.disabled && 'opacity-mr-disabled cursor-not-allowed',
                                )}
                            >
                                <span className="flex-1 truncate">{o.label}</span>
                                {String(o.value) === String(value) && <Check className="size-4 shrink-0" />}
                            </RD.Item>
                        ))}
                    </RD.Content>
                </RD.Portal>
            </RD.Root>

            <select ref={internalRef} value={value} onChange={onChange} disabled={disabled} className="sr-only" tabIndex={-1} aria-hidden="true" {...rest}>
                {placeholder && (
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                )}
                {options.map(o => (
                    <option key={o.value} value={o.value} disabled={o.disabled}>
                        {o.label}
                    </option>
                ))}
            </select>

            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Select;
