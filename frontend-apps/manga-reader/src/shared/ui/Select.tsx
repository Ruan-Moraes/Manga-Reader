import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

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

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, error, hint, disabled, className, id, ...rest }, ref) {
    const describedBy = hint || error ? `${id ?? 'select'}-hint` : undefined;

    return (
        <div className="flex flex-col gap-1">
            <div
                className={cn(
                    'relative flex h-11 items-center rounded-mr-xs border bg-mr-primary transition-colors duration-mr-default',
                    'has-[:focus]:border-mr-accent has-[:hover:not(:disabled)]:border-mr-accent-50',
                    error ? 'border-mr-danger' : 'border-mr-tertiary',
                    disabled && 'opacity-mr-disabled',
                    className,
                )}
            >
                <select
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    aria-invalid={!!error || undefined}
                    aria-describedby={describedBy}
                    className="size-full appearance-none bg-transparent px-3 pr-9 text-mr-body text-mr-fg outline-none"
                    {...rest}
                >
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
                <ChevronDown className="pointer-events-none absolute right-3 size-4 text-mr-tertiary" />
            </div>
            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Select;
