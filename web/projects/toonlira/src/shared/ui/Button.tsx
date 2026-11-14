import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

export type ButtonVariant = 'primary' | 'raised' | 'ghost' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconRight?: LucideIcon;
    danger?: boolean;
    block?: boolean;
    loading?: boolean;
    children?: ReactNode;
}
const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-ui-accent text-ui-on-accent border border-ui-accent-border ' + 'hover:opacity-[0.85] active:scale-[0.98]',
    raised:
        'bg-transparent text-ui-fg border border-ui-tertiary ' +
        'shadow-ui-elevated ' +
        'hover:shadow-none hover:outline hover:outline-1 hover:outline-ui-tertiary hover:font-ui-extrabold ' +
        'active:scale-[0.98]',
    ghost: 'bg-ui-surface text-ui-fg border border-ui-tertiary ' + 'hover:bg-ui-accent-25 active:bg-ui-accent-50 active:scale-[0.98]',
    inverse:
        'bg-transparent text-ui-on-overlay border border-ui-on-overlay/60 ' +
        'hover:bg-ui-overlay-control hover:border-ui-on-overlay active:scale-[0.98]',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-9 px-3 text-ui-small gap-ui-xs',
    md: 'min-h-10 px-4 text-ui-body gap-ui-sm',
    lg: 'min-h-12 px-5 text-ui-h4 gap-ui-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'raised', size = 'md', icon: Icon, iconRight: IconRight, danger, block, loading, disabled, children, className, ...rest },
    ref,
) {
    const isDisabled = disabled || loading;

    return (
        <button
            ref={ref}
            type={rest.type ?? 'button'}
            aria-busy={loading || undefined}
            disabled={isDisabled}
            className={cn(
                'inline-flex items-center justify-center rounded-ui-xs font-ui-bold cursor-pointer',
                'transition-all duration-ui-default ease-mr',
                'disabled:opacity-ui-disabled disabled:cursor-not-allowed',
                'ui-focus-ring',
                variantClass[variant],
                sizeClass[size],
                danger && variant === 'ghost' && 'text-ui-danger border-ui-danger',
                block && 'w-full',
                className,
            )}
            {...rest}
        >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : Icon && <Icon className="size-4" aria-hidden="true" />}
            {children}
            {!loading && IconRight && <IconRight className="size-4" aria-hidden="true" />}
        </button>
    );
});

export default Button;
