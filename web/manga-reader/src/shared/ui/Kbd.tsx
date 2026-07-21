import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export interface KbdProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
    size?: 'sm' | 'md';
    /** 'accent' (padrão) ou 'muted' (fundo gray-800, texto muted — tabelas de atalhos). */
    tone?: 'accent' | 'muted';
}

export const Kbd = ({ children, size = 'md', tone = 'accent', className, ...rest }: KbdProps) => (
    <kbd
        className={cn(
            'inline-flex items-center rounded-mr-sm border border-b-2 font-mr-mono font-mr-extrabold',
            tone === 'muted' ? 'border-mr-gray-700 bg-mr-gray-800 text-mr-fg-muted' : 'border-mr-tertiary bg-mr-primary text-mr-accent-fg',
            size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-mr-tiny',
            className,
        )}
        {...rest}
    >
        {children}
    </kbd>
);

export default Kbd;
