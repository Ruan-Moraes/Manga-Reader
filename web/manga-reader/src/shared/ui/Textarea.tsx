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
                    'min-h-24 w-full rounded-mr-sm border bg-mr-primary px-3 py-3 text-mr-body leading-relaxed resize-y transition-[border-color,box-shadow] duration-mr-fast',
                    'placeholder:text-mr-tertiary outline-none',
                    'hover:not(:disabled):border-mr-gray-500 focus:border-mr-accent-border focus:ring-2 focus:ring-mr-accent-25',
                    error ? 'border-mr-danger focus:border-mr-danger focus:ring-mr-danger-15' : 'border-mr-border',
                    disabled && 'opacity-mr-disabled',
                    className,
                )}
                {...rest}
            />
            {(error ?? hint) && (
                <p id={describedBy} className={cn('text-mr-tiny', error ? 'text-mr-danger' : 'text-mr-fg-subtle')}>
                    {error ?? hint}
                </p>
            )}
        </div>
    );
});

export default Textarea;
