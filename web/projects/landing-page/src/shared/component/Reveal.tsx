import {
    createElement,
    memo,
    type CSSProperties,
    type ElementType,
    type ReactNode,
} from 'react';

import { useInView } from '@/shared/hook/useInView';

export interface RevealProps {
    children: ReactNode;
    delay?: number;
    y?: number;
    as?: ElementType;
    style?: CSSProperties;
    className?: string;
}

type RevealStyle = CSSProperties & {
    '--reveal-delay'?: string;
    '--reveal-y'?: string;
};

/**
 * Wrapper de entrada (fade + slide) ao entrar na viewport.
 * Respeita prefers-reduced-motion e não força reflows de layout síncronos.
 */
export function Reveal({
    children,
    delay = 0,
    y = 18,
    as = 'div',
    style,
    className,
}: RevealProps) {
    const { ref, inView } = useInView<HTMLElement>({
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px',
        once: true,
    });

    return createElement(
        as,
        {
            ref,
            className: `translate-y-[var(--reveal-y)] opacity-0 transition-[opacity,translate] duration-600 ease-out [transition-delay:var(--reveal-delay)] motion-reduce:translate-y-0 motion-reduce:!opacity-100 ${
                inView ? '!translate-y-0 !opacity-100' : ''
            } ${className ?? ''}`,
            style: {
                ...style,
                '--reveal-delay': `${delay}ms`,
                '--reveal-y': `${y}px`,
            } as RevealStyle,
        },
        children,
    );
}

export default memo(Reveal);
