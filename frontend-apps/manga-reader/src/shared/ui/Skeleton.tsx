import { cn } from '@/lib/cn';
import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'rect' | 'circle' | 'text';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const shimmer = 'motion-safe:animate-pulse bg-gradient-to-r from-mr-gray-700 via-mr-gray-600 to-mr-gray-700 bg-[length:200%_100%]';

const variantClass: Record<NonNullable<SkeletonProps['variant']>, string> = {
    rect: 'rounded-mr-xs',
    circle: 'rounded-mr-full',
    text: 'rounded-mr-xs',
};

export const Skeleton = ({ variant = 'rect', width, height, lines = 1, className, ...rest }: SkeletonProps) => {
    if (variant === 'text' && lines > 1) {
        return (
            <div className={cn('flex flex-col gap-2', className)} {...rest}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(variantClass.text, shimmer)}
                        style={{
                            width: i === lines - 1 ? '70%' : '100%',
                            height: 14,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Carregando"
            className={cn(variantClass[variant], shimmer, className)}
            style={{
                width: width ?? '100%',
                height: height ?? (variant === 'circle' ? 40 : 16),
            }}
            {...rest}
        />
    );
};

export default Skeleton;
