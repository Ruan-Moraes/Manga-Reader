import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'raised' | 'ghost';
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
    primary: 'bg-mr-accent text-mr-primary border border-mr-accent ' + 'hover:opacity-[0.85] active:scale-[0.98]',
    raised:
        'bg-transparent text-mr-fg border border-mr-tertiary ' +
        'shadow-mr-elevated ' +
        'hover:shadow-none hover:outline hover:outline-1 hover:outline-mr-tertiary hover:font-mr-extrabold ' +
        'active:scale-[0.98]',
    ghost: 'bg-mr-surface text-mr-fg border border-mr-tertiary ' + 'hover:bg-mr-accent-25 active:bg-mr-accent-50 active:scale-[0.98]',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'h-8 px-3 text-mr-small gap-mr-xs',
    md: 'h-11 px-4 text-mr-body gap-mr-sm',
    lg: 'h-13 px-5 text-mr-h4 gap-mr-sm',
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
                'inline-flex items-center justify-center rounded-mr-xs font-mr-bold',
                'transition-all duration-mr-default ease-mr',
                'disabled:opacity-mr-disabled disabled:cursor-not-allowed',
                'focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2',
                variantClass[variant],
                sizeClass[size],
                danger && variant === 'ghost' && 'text-mr-danger border-mr-danger',
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
