import type { InputHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

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
                className={cn(
                    'w-full bg-transparent text-ui-body outline-none placeholder:text-ui-tertiary',
                    disabled && 'cursor-not-allowed text-ui-fg-disabled placeholder:text-ui-fg-disabled opacity-100',
                    className,
                )}
                {...rest}
            />
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <div
                className={cn(
                    'relative flex h-11 items-center gap-2 rounded-ui-sm border bg-ui-primary px-3 transition-[border-color,box-shadow] duration-ui-fast',
                    'has-[:hover:not(:disabled)]:border-ui-gray-500 has-[:focus]:border-ui-accent-border has-[:focus]:ring-2 has-[:focus]:ring-ui-accent-25',
                    readOnly && 'bg-ui-gray-900',
                    error ? 'border-ui-danger has-[:focus]:border-ui-danger has-[:focus]:ring-ui-danger-15' : 'border-ui-border',
                    disabled && 'cursor-not-allowed bg-ui-surface-muted border-ui-border-subtle',
                )}
            >
                {Lead && <Lead className="size-4 shrink-0 text-ui-tertiary" />}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    readOnly={readOnly}
                    aria-invalid={!!error || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'size-full min-w-0 flex-1 bg-transparent text-ui-body outline-none placeholder:text-ui-tertiary',
                        disabled && 'cursor-not-allowed text-ui-fg-disabled placeholder:text-ui-fg-disabled opacity-100',
                        className,
                    )}
                    {...rest}
                />
                {Trail &&
                    (onTrailingClick ? (
                        <button
                            type="button"
                            onClick={onTrailingClick}
                            aria-label={trailingLabel}
                            className="flex shrink-0 text-ui-tertiary hover:text-ui-fg transition-colors"
                        >
                            <Trail className="size-4" />
                        </button>
                    ) : (
                        <Trail className="size-4 shrink-0 text-ui-tertiary" />
                    ))}
            </div>
            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-ui-tiny', error ? 'text-ui-danger' : 'text-ui-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Input;
