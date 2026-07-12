import { cn } from '@shared/lib/cn';

import type { ReactNode } from 'react';

export interface SectionHeaderProps {
    eyebrow?: string;
    title: string;
    meta?: ReactNode;
    action?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    as?: 'h2' | 'h3' | 'h4';
    className?: string;
}

const sizeMap: Record<NonNullable<SectionHeaderProps['size']>, string> = {
    sm: 'text-[clamp(16px,3.5vw,18px)]',
    md: 'text-[clamp(20px,4vw,26px)]',
    lg: 'text-[clamp(24px,5vw,32px)]',
};

export const SectionHeader = ({ eyebrow, title, meta, action, size = 'md', as = 'h2', className }: SectionHeaderProps) => {
    const TitleTag = as;

    return (
        <header className={cn('mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && <div className="mr-label mb-1 text-mr-fg-subtle">{eyebrow}</div>}
                <TitleTag className={cn('m-0 font-mr-extrabold leading-tight tracking-mr text-mr-fg', sizeMap[size])}>{title}</TitleTag>
            </div>
            {(meta ?? action) && (
                <div className="flex w-full min-w-0 flex-wrap items-center gap-3 text-mr-tiny text-mr-fg-subtle sm:w-auto sm:justify-end">
                    {meta}
                    {action}
                </div>
            )}
        </header>
    );
};

export default SectionHeader;
