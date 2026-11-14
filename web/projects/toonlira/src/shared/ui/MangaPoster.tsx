import { memo } from 'react';

import { cn } from '@shared/lib/cn';

export interface MangaPosterProps {
    cover?: string;
    fallbackGradient?: string;
    alt?: string;
    size?: number;
    shape?: 'rect' | 'square';
    radius?: 'sm' | 'md' | 'lg';
    elevated?: boolean;
    onClick?: () => void;
    className?: string;
}

const radiusMap = {
    sm: 'rounded-ui-sm',
    md: 'rounded-ui-xs',
    lg: 'rounded-ui-lg',
};

const MangaPosterBase = ({ cover, fallbackGradient, alt = '', size = 240, shape = 'rect', radius = 'md', elevated, onClick, className }: MangaPosterProps) => {
    const ratio = shape === 'square' ? '1 / 1' : '2 / 3';
    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            aria-label={onClick ? alt || undefined : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
            className={cn(
                'mx-auto max-w-full overflow-hidden border border-ui-border bg-ui-surface',
                radiusMap[radius],
                elevated && 'shadow-ui-elevated',
                onClick && 'cursor-pointer transition-transform duration-ui-default hover:-translate-y-0.5',
                className,
            )}
            style={{
                width: size,
                aspectRatio: ratio,
                background: !cover ? (fallbackGradient ?? 'var(--ui-poster-gradient)') : undefined,
            }}
        >
            {cover && <img src={cover} alt={alt} loading="lazy" className="size-full object-cover" />}
        </div>
    );
};

export const MangaPoster = memo(MangaPosterBase);

export default MangaPoster;
