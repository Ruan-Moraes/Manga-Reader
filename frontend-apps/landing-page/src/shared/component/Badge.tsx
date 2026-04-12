import type { ReactNode } from 'react';

interface BadgeProps {
    icon: ReactNode;
    label: string;
    variant?: 'default' | 'highlight';
    className?: string;
}

export default function Badge({
    icon,
    label,
    variant = 'default',
    className = '',
}: BadgeProps) {
    const base =
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors';

    const variants = {
        default: 'bg-secondary border-tertiary text-white',
        highlight: 'bg-accent-subtle border-accent text-accent',
    };

    return (
        <span className={`${base} ${variants[variant]} ${className}`}>
            {icon}
            {label}
        </span>
    );
}
