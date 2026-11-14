import { cn } from '@shared/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'flat' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: CardPadding;
    interactive?: boolean;
    children: ReactNode;
}

const variantClass: Record<CardVariant, string> = {
    default: 'rounded-ui-xs bg-ui-surface border border-ui-border',
    flat: 'rounded-ui-xs bg-ui-surface border border-ui-border',
    elevated: 'rounded-ui-xs bg-ui-surface border border-ui-border shadow-ui-elevated',
};

const paddingClass: Record<CardPadding, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

export const Card = ({ variant = 'default', padding = 'md', interactive, className, children, ...rest }: CardProps) => (
    <div
        className={cn(
            variantClass[variant],
            paddingClass[padding],
            interactive && 'cursor-pointer transition-all duration-ui-default hover:border-ui-accent-50 hover:shadow-ui-elevated hover:-translate-y-0.5',
            className,
        )}
        {...rest}
    >
        {children}
    </div>
);

export default Card;
