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
                className={cn('group flex cursor-pointer items-start gap-2 text-ui-body', disabled && 'cursor-not-allowed opacity-ui-disabled', className)}
            >
                <input ref={ref} id={fieldId} type="checkbox" disabled={disabled} aria-invalid={!!error || undefined} className="peer sr-only" {...rest} />
                <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-ui-xs border border-ui-tertiary bg-transparent text-ui-on-accent transition-colors duration-ui-default peer-checked:border-ui-accent-border peer-checked:bg-ui-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ui-focus-ring"
                >
                    <Check className="size-3 opacity-0 transition-opacity duration-ui-default group-has-[:checked]:opacity-100" strokeWidth={3} />
                </span>
                {label && (
                    <span className="flex flex-col">
                        <span className="text-ui-fg">{label}</span>
                        {hint && !error && <span className="text-ui-tiny text-ui-fg-subtle">{hint}</span>}
                        {error && <span className="text-ui-tiny text-ui-danger">{error}</span>}
                    </span>
                )}
            </label>
        );
    }

    return (
        <label
            htmlFor={fieldId}
            className={cn('flex cursor-pointer items-start gap-2 text-ui-body', disabled && 'cursor-not-allowed opacity-ui-disabled', className)}
        >
            <input
                ref={ref}
                id={fieldId}
                type="checkbox"
                disabled={disabled}
                aria-invalid={!!error || undefined}
                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-ui-xs"
                style={{ accentColor: 'var(--ui-accent)' }}
                {...rest}
            />
            {label && (
                <span className="flex flex-col">
                    <span className="text-ui-fg">{label}</span>
                    {hint && !error && <span className="text-ui-tiny text-ui-fg-subtle">{hint}</span>}
                    {error && <span className="text-ui-tiny text-ui-danger">{error}</span>}
                </span>
            )}
        </label>
    );
});

export default Checkbox;
