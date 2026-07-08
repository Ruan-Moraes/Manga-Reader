import { forwardRef } from 'react';

import { cn } from '@shared/lib/cn';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: ReactNode;
    description?: string;
    /** Renderiza só o track 36×20 (sem card/label interno) — para controle inline à direita de um field. */
    bare?: boolean;
}

const Track = ({ checked }: { checked: boolean }) => (
    <span
        className={cn('relative ml-auto h-5 w-9 shrink-0 rounded-mr-full transition-colors duration-mr-default', checked ? 'bg-mr-accent' : 'bg-mr-gray-700')}
    >
        <span
            className={cn(
                'absolute top-0.5 size-4 rounded-mr-full transition-all duration-mr-default',
                checked ? 'left-[18px] bg-mr-primary' : 'left-0.5 bg-white',
            )}
        />
    </span>
);

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
    { checked, onChange, label, description, disabled, bare, className, ...rest },
    ref,
) {
    if (bare) {
        return (
            <button
                ref={ref}
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={cn(
                    'mr-focus-ring inline-flex rounded-mr-full transition-opacity duration-mr-default',
                    disabled && 'cursor-not-allowed opacity-mr-disabled',
                    className,
                )}
                {...rest}
            >
                <Track checked={checked} />
            </button>
        );
    }

    return (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'flex w-full items-center justify-between gap-3 rounded-mr-sm border border-mr-border-subtle bg-mr-surface-muted p-3 text-left transition-colors duration-mr-default hover:border-mr-border',
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
            <Track checked={checked} />
        </button>
    );
});

export default Switch;
