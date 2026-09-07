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

const Track = ({ checked, disabled }: { checked: boolean; disabled?: boolean }) => (
    <span
        className={cn(
            'relative ml-auto h-5 w-9 shrink-0 rounded-ui-full transition-colors duration-ui-default',
            disabled
                ? 'border border-ui-border-subtle bg-ui-surface-muted'
                : checked
                  ? 'bg-ui-accent'
                  : 'bg-ui-control-track-off',
        )}
    >
        <span
            className={cn(
                'absolute top-0.5 size-4 rounded-ui-full transition-all duration-ui-default',
                checked ? 'left-[18px]' : 'left-0.5',
                disabled ? 'bg-ui-fg-disabled' : checked ? 'bg-ui-on-accent' : 'bg-ui-control-thumb-off',
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
                    'ui-focus-ring inline-flex rounded-ui-full transition-opacity duration-ui-default',
                    disabled && 'cursor-not-allowed opacity-[0.7]',
                    className,
                )}
                {...rest}
            >
                <Track checked={checked} disabled={disabled} />
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
                'flex w-full items-center justify-between gap-3 rounded-ui-sm border border-ui-border-subtle bg-ui-surface-muted p-3 text-left transition-colors duration-ui-default hover:border-ui-border',
                'ui-focus-ring',
                disabled && 'cursor-not-allowed opacity-[0.7]',
                className,
            )}
            {...rest}
        >
            {label && (
                <span className="flex flex-col">
                    <span className="text-ui-body font-ui-bold text-ui-fg">{label}</span>
                    {description && <span className="text-ui-tiny text-ui-fg-subtle">{description}</span>}
                </span>
            )}
            <Track checked={checked} disabled={disabled} />
        </button>
    );
});

export default Switch;
