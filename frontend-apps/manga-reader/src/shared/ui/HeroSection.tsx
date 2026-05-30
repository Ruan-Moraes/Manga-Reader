import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface HeroSectionProps {
    eyebrow?: string;
    eyebrowIcon?: LucideIcon;
    title: string;
    description?: string;
    meta?: ReactNode;
    actions?: ReactNode;
    visual?: ReactNode;
    background?: string;
    className?: string;
}

export const HeroSection = ({ eyebrow, eyebrowIcon: EyeIcon, title, description, meta, actions, visual, background, className }: HeroSectionProps) => (
    <section
        className={cn('relative flex flex-col-reverse gap-6 overflow-hidden rounded-mr-lg p-6 md:flex-row md:items-center md:gap-10 md:p-10', className)}
        style={{
            background: background ?? 'linear-gradient(135deg, #2a1f0f, #161616)',
        }}
    >
        <div className="flex min-w-0 flex-1 flex-col">
            {eyebrow && (
                <div className="mr-label mb-2.5 inline-flex items-center gap-1.5 text-mr-accent">
                    {EyeIcon && <EyeIcon className="size-3.5" aria-hidden="true" />}
                    {eyebrow}
                </div>
            )}
            <h1 className="mb-1 text-[clamp(24px,6vw,36px)] font-mr-bold leading-tight tracking-mr text-mr-fg">{title}</h1>
            {description && <p className="mb-4 max-w-prose leading-relaxed text-mr-body text-mr-gray-200">{description}</p>}
            {meta && <div className="mb-4 flex flex-wrap items-center gap-2">{meta}</div>}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {visual && <div className="flex shrink-0 justify-center md:w-auto">{visual}</div>}
    </section>
);

export default HeroSection;
