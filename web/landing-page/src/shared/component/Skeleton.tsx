import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export default function Skeleton({ className = '', ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-shimmer rounded bg-[linear-gradient(90deg,var(--color-surface-muted),var(--color-surface-elevated),var(--color-surface-muted))] bg-[length:200%_100%]',
                className,
            )}
            aria-hidden="true"
            {...props}
        />
    );
}
