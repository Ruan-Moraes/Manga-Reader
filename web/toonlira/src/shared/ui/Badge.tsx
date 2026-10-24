import type { ReactNode } from 'react';
import type React from 'react';

export type BadgeVariant = 'accent' | 'neutral' | 'danger';

export interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
}

const styleMap: Record<BadgeVariant, string> = {
    accent: 'bg-ui-accent-25 text-ui-accent-fg border-ui-accent-50',
    neutral: 'bg-ui-gray-800 text-ui-fg-muted border-ui-gray-700',
    danger: 'bg-ui-danger-15 text-ui-danger border-ui-danger-border',
};

export const Badge = ({ variant = 'accent', icon: Icon, children }: BadgeProps) => (
    <span
        className={`inline-flex items-center gap-1 rounded-ui-full border px-2 py-0.5 text-ui-tiny font-ui-bold uppercase tracking-[0.08em] ${styleMap[variant]}`}
    >
        {Icon && <Icon className="size-3" />}
        {children}
    </span>
);

export default Badge;
