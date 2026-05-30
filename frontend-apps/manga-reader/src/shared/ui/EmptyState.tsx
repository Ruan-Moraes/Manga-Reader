import type { ReactNode } from 'react';

export type ChibiKind = 'feliz' | 'triste' | 'surpresa' | 'zangada' | 'pensando' | 'duvida' | '404';

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

    return (
        <div
            className={
                variant === 'horizontal'
                    ? 'flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left md:gap-10'
                    : 'flex flex-col items-center gap-6 text-center'
            }
        >
            <img src={`/illustrations/${illustration}.png`} alt="" width={px} height={px} className="shrink-0" />
            <div className="flex flex-col items-center gap-2 md:items-start">
                <h3 className="text-mr-h3 font-mr-extrabold text-mr-fg">{title}</h3>
                {description && <p className="max-w-md text-mr-body text-mr-fg-muted">{description}</p>}
                {action && <div className="mt-2">{action}</div>}
            </div>
        </div>
    );
};

export default EmptyState;
