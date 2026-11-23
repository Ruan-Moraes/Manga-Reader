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
            'inline-flex items-center rounded-ui-sm border border-b-2 font-ui-mono font-ui-extrabold',
            tone === 'muted' ? 'border-ui-gray-700 bg-ui-gray-800 text-ui-fg-muted' : 'border-ui-tertiary bg-ui-primary text-ui-accent-fg',
            size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-ui-tiny',
            className,
        )}
        {...rest}
    >
        {children}
    </kbd>
);

export default Kbd;
