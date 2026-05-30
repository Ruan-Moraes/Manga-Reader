import { forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: ReactNode;
    hint?: string;
    error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, hint, error, disabled, className, id, ...rest }, ref) {
    const auto = useId();
    const fieldId = id ?? auto;

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
