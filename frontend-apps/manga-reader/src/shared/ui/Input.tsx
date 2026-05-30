import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    leadingIcon?: LucideIcon;
    trailingIcon?: LucideIcon;
    onTrailingClick?: () => void;
    trailingLabel?: string;
    error?: string;
    hint?: string;
    variant?: 'default' | 'plain';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { leadingIcon: Lead, trailingIcon: Trail, onTrailingClick, trailingLabel, error, hint, disabled, readOnly, className, id, variant = 'default', ...rest },
    ref,
) {
    const auto = useId();

    const inputId = id ?? auto;

    const describedBy = hint || error ? `${inputId}-hint` : undefined;

    if (variant === 'plain') {
        return (
            <input
                ref={ref}
                id={inputId}
                disabled={disabled}
                readOnly={readOnly}
                aria-invalid={!!error || undefined}
                aria-describedby={describedBy}
                className={cn('w-full bg-transparent text-mr-body outline-none placeholder:text-mr-tertiary', disabled && 'opacity-mr-disabled', className)}
                {...rest}
            />
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <div
                className={cn(
                    'relative flex h-11 items-center gap-2 rounded-mr-xs border bg-mr-primary px-3 transition-colors duration-mr-default',
                    'has-[:focus]:border-mr-accent has-[:hover:not(:disabled)]:border-mr-accent-50',
                    readOnly && 'bg-mr-gray-900',
                    error ? 'border-mr-danger' : 'border-mr-tertiary',
                    disabled && 'opacity-mr-disabled',
                )}
            >
                {Lead && <Lead className="size-4 shrink-0 text-mr-tertiary" />}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    readOnly={readOnly}
                    aria-invalid={!!error || undefined}
                    aria-describedby={describedBy}
                    className={cn('size-full min-w-0 flex-1 bg-transparent text-mr-body outline-none placeholder:text-mr-tertiary', className)}
                    {...rest}
                />
                {Trail &&
                    (onTrailingClick ? (
                        <button
                            type="button"
                            onClick={onTrailingClick}
                            aria-label={trailingLabel}
                            className="flex shrink-0 text-mr-tertiary hover:text-mr-fg transition-colors"
                        >
                            <Trail className="size-4" />
                        </button>
                    ) : (
                        <Trail className="size-4 shrink-0 text-mr-tertiary" />
                    ))}
            </div>
            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Input;
