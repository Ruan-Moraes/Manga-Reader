import { forwardRef, useId, useEffect, useRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@shared/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
    hint?: string;
    autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    { error, hint, disabled, autoResize, className, id, onChange, ...rest },
    ref,
) {
    const auto = useId();
    const fieldId = id ?? auto;

    const describedBy = hint || error ? `${fieldId}-hint` : undefined;

    const innerRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!autoResize) return;

        const el = innerRef.current;

        if (!el) return;

        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [autoResize, rest.value]);

    return (
        <div className="flex flex-col gap-1">
            <textarea
                ref={node => {
                    innerRef.current = node;

                    if (typeof ref === 'function') {
                        ref(node);

                        return;
                    }

                    if (ref) {
                        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;

                        return;
                    }
                }}
                id={fieldId}
                disabled={disabled}
                aria-invalid={!!error || undefined}
                aria-describedby={describedBy}
                onChange={onChange}
                rows={rest.rows ?? 4}
                className={cn(
                    'min-h-24 w-full rounded-ui-sm border bg-ui-primary px-3 py-3 text-ui-body leading-relaxed resize-y transition-[border-color,box-shadow] duration-ui-fast',
                    'placeholder:text-ui-tertiary outline-none',
                    'hover:not(:disabled):border-ui-gray-500 focus:border-ui-accent-border focus:ring-2 focus:ring-ui-accent-25',
                    error ? 'border-ui-danger focus:border-ui-danger focus:ring-ui-danger-15' : 'border-ui-border',
                    disabled && 'cursor-not-allowed bg-ui-surface-muted border-ui-border-subtle text-ui-fg-disabled placeholder:text-ui-fg-disabled opacity-100',
                    className,
                )}
                {...rest}
            />
            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-ui-tiny', error ? 'text-ui-danger' : 'text-ui-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Textarea;
