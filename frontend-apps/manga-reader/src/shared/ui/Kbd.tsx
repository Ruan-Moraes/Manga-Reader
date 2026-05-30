import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
    size?: 'sm' | 'md';
}

export const Kbd = ({ children, size = 'md', className, ...rest }: KbdProps) => (
    <kbd
        className={cn(
            'inline-flex items-center rounded-mr-xs border border-mr-tertiary border-b-2 bg-mr-primary font-mr-mono font-mr-extrabold text-mr-accent',
            size === 'sm' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-mr-tiny',
            className,
        )}
        {...rest}
    >
        {children}
    </kbd>
);

export default Kbd;
