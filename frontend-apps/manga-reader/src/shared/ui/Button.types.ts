import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'raised' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconRight?: LucideIcon;
    /** Variante destrutiva — só em ghost. Aplica cor danger. */
    danger?: boolean;
    block?: boolean;
    loading?: boolean;
    children?: ReactNode;
}
