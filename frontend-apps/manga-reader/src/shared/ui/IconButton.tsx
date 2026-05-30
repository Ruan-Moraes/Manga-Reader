import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import { Button } from './Button';
import type { ButtonVariant, ButtonSize } from './Button';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon;
    variant?: ButtonVariant;
    size?: ButtonSize;
    danger?: boolean;
    'aria-label': string;
}

const iconSizeClass: Record<NonNullable<IconButtonProps['size']>, string> = {
    sm: 'size-3.5',
    md: 'size-[18px]',
    lg: 'size-[22px]',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
    { icon: Icon, size = 'md', variant = 'ghost', className, ...rest },
    ref,
) {
    return (
        <Button ref={ref} variant={variant} size={size} className={cn('aspect-square !p-0', className)} {...rest}>
            <Icon className={iconSizeClass[size]} aria-hidden="true" />
        </Button>
    );
});

export default IconButton;
