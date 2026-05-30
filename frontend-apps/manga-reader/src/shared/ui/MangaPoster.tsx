import { memo } from 'react';

import { cn } from '@/lib/cn';

export interface MangaPosterProps {
    cover?: string;
    fallbackGradient?: string;
    alt?: string;
    size?: number;
    shape?: 'rect' | 'square';
    radius?: 'sm' | 'md' | 'lg';
    elevated?: boolean;
    onClick?: () => void;
}

const radiusMap = {
    sm: 'rounded-mr-sm',
    md: 'rounded-mr-md',
    lg: 'rounded-mr-lg',
};

const MangaPosterBase = ({ cover, fallbackGradient, alt = '', size = 240, shape = 'rect', radius = 'md', elevated, onClick }: MangaPosterProps) => {
    const ratio = shape === 'square' ? '1 / 1' : '2 / 3';
    return (
        <div
            onClick={onClick}
            role={onClick ? 'button' : undefined}
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
                'overflow-hidden border border-mr-border bg-mr-surface',
                radiusMap[radius],
                elevated && 'shadow-mr-elevated',
                onClick && 'cursor-pointer transition-transform duration-mr-default hover:-translate-y-0.5',
            )}
            style={{
                width: size,
                aspectRatio: ratio,
                background: !cover ? (fallbackGradient ?? 'linear-gradient(135deg, #2a1f0f, #161616)') : undefined,
            }}
        >
            {cover && <img src={cover} alt={alt} loading="lazy" className="size-full object-cover" />}
        </div>
    );
};

export const MangaPoster = memo(MangaPosterBase);

export default MangaPoster;
