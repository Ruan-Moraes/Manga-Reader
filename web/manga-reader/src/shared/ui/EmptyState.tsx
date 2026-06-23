import { useState, type ReactNode } from 'react';

import { illustrationUrl, type IllustrationName } from '@shared/lib/illustrations';

export type ChibiKind = IllustrationName;

export interface EmptyStateProps {
    illustration: ChibiKind;
    size?: 'sm' | 'md' | 'lg';
    title: string;
    description?: string;
    action?: ReactNode;
    variant?: 'default' | 'horizontal';
}

const sizeMap: Record<NonNullable<EmptyStateProps['size']>, number> = {
    sm: 80,
    md: 120,
    lg: 200,
};

export const EmptyState = ({ illustration, size = 'md', title, description, action, variant = 'default' }: EmptyStateProps) => {
    const px = sizeMap[size];

    const isHorizontal = variant === 'horizontal';

    const src = illustrationUrl(illustration);

    const [errored, setErrored] = useState(false);

    return (
        <div
            className={
                isHorizontal
                    ? 'flex w-full flex-col items-center gap-6 py-8 text-center md:flex-row md:items-center md:gap-10 md:text-left'
                    : 'flex w-full flex-col items-center gap-6 py-8 text-center'
            }
        >
            {errored || !src ? (
                <div
                    aria-hidden="true"
                    style={{ width: px, height: px }}
                    className="flex shrink-0 items-center justify-center rounded-2xl bg-mr-surface-muted text-mr-fg-muted"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-2/5 w-2/5" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                    </svg>
                </div>
            ) : (
                <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    width={px}
                    height={px}
                    style={{ width: px, height: px }}
                    className="shrink-0 object-contain drop-shadow-sm select-none"
                    loading="lazy"
                    draggable={false}
                    onError={() => setErrored(true)}
                />
            )}
            <div className={isHorizontal ? 'flex flex-col items-center gap-2 md:items-start' : 'flex max-w-md flex-col items-center gap-2'}>
                <h3 className="text-mr-h3 font-mr-extrabold text-mr-fg">{title}</h3>
                {description && <p className="text-mr-body text-balance text-mr-fg-muted">{description}</p>}
                {action && <div className="mt-2 flex justify-center md:justify-start">{action}</div>}
            </div>
        </div>
    );
};

export default EmptyState;
