import type { ReactNode } from 'react';

export interface TooltipProps {
    content: string;
    children: ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

const sideClass: Record<NonNullable<TooltipProps['side']>, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip = ({ content, children, side = 'top', delay = 300 }: TooltipProps) => (
    <span className="group relative inline-flex">
        {children}
        <span
            role="tooltip"
            style={{ transitionDelay: `${delay}ms` }}
            className={`pointer-events-none absolute z-mr-tooltip whitespace-nowrap rounded-mr-sm border border-mr-border bg-mr-gray-900 px-2.5 py-1 text-mr-tiny font-mr-semibold text-mr-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${sideClass[side]}`}
        >
            {content}
        </span>
    </span>
);

export default Tooltip;
