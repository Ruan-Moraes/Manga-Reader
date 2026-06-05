import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: ReactNode;
    hint?: string;
    error?: string;
    variant?: 'native' | 'box';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    { label, hint, error, disabled, className, id, variant = 'native', ...rest },
    ref,
) {
    const auto = useId();

    const fieldId = id ?? auto;

    if (variant === 'box') {
        return (
            <label
                htmlFor={fieldId}
                className={cn('group flex cursor-pointer items-start gap-2 text-mr-body', disabled && 'cursor-not-allowed opacity-mr-disabled', className)}
            >
                <input ref={ref} id={fieldId} type="checkbox" disabled={disabled} aria-invalid={!!error || undefined} className="peer sr-only" {...rest} />
                <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-mr-xs border border-mr-tertiary bg-transparent text-mr-primary transition-colors duration-mr-default peer-checked:border-mr-accent peer-checked:bg-mr-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-mr-accent"
                >
                    <Check className="size-3 opacity-0 transition-opacity duration-mr-default group-has-[:checked]:opacity-100" strokeWidth={3} />
                </span>
                {label && (
                    <span className="flex flex-col">
                        <span className="text-mr-fg">{label}</span>
                        {hint && !error && <span className="text-mr-tiny text-mr-fg-subtle">{hint}</span>}
                        {error && <span className="text-mr-tiny text-mr-danger">{error}</span>}
                    </span>
                )}
            </label>
        );
    }

    return (
        <label
            htmlFor={fieldId}
            className={cn('flex cursor-pointer items-start gap-2 text-mr-body', disabled && 'cursor-not-allowed opacity-mr-disabled', className)}
        >
            <input
                ref={ref}
                id={fieldId}
                type="checkbox"
                disabled={disabled}
                aria-invalid={!!error || undefined}
                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-mr-xs"
                style={{ accentColor: 'var(--mr-accent)' }}
                {...rest}
            />
            {label && (
                <span className="flex flex-col">
                    <span className="text-mr-fg">{label}</span>
                    {hint && !error && <span className="text-mr-tiny text-mr-fg-subtle">{hint}</span>}
                    {error && <span className="text-mr-tiny text-mr-danger">{error}</span>}
                </span>
            )}
        </label>
    );
});

export default Checkbox;
