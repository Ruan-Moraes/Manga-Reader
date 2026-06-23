import type { ReactNode } from 'react';
import type React from 'react';

export type BadgeVariant = 'accent' | 'neutral' | 'danger';

export interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
}

const styleMap: Record<BadgeVariant, string> = {
    accent: 'bg-mr-accent-25 text-mr-accent border-mr-accent-50',
    neutral: 'bg-mr-gray-800 text-mr-fg-muted border-mr-gray-700',
    danger: 'bg-mr-danger-15 text-mr-danger border-[rgba(255,120,79,0.4)]',
};

export const Badge = ({ variant = 'accent', icon: Icon, children }: BadgeProps) => (
    <span
        className={`inline-flex items-center gap-1 rounded-mr-full border px-2 py-0.5 text-mr-tiny font-mr-bold uppercase tracking-[0.08em] ${styleMap[variant]}`}
    >
        {Icon && <Icon className="size-3" />}
        {children}
    </span>
);

export default Badge;
