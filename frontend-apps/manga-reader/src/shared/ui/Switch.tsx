import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    description?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({ checked, onChange, label, description, disabled, className, ...rest }, ref) {
    return (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'flex w-full items-center justify-between gap-3 rounded-mr-xs border border-mr-border-subtle bg-mr-surface p-3 text-left transition-colors duration-mr-default',
                'mr-focus-ring',
                disabled && 'cursor-not-allowed opacity-mr-disabled',
                className,
            )}
            {...rest}
        >
            {label && (
                <span className="flex flex-col">
                    <span className="text-mr-body font-mr-bold text-mr-fg">{label}</span>
                    {description && <span className="text-mr-tiny text-mr-fg-subtle">{description}</span>}
                </span>
            )}
            <span
                className={cn(
                    'relative ml-auto h-5 w-9 shrink-0 rounded-mr-full transition-colors duration-mr-default',
                    checked ? 'bg-mr-accent' : 'bg-mr-gray-700',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 size-4 rounded-mr-full transition-all duration-mr-default',
                        checked ? 'left-[18px] bg-mr-primary' : 'left-0.5 bg-white',
                    )}
                />
            </span>
        </button>
    );
});

export default Switch;
