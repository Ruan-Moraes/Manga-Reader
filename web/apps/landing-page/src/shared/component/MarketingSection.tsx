import type { ReactNode } from 'react';

interface SectionHeadingProps {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'center' | 'left';
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
    return (
        <span className="mb-3.5 inline-flex items-center gap-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.16em] text-accent-fg before:h-px before:w-[22px] before:bg-current before:opacity-65">
            {children}
        </span>
    );
}

export function SectionHeading({
    eyebrow,
    title,
    description,
    align = 'center',
}: SectionHeadingProps) {
    return (
        <header
            className={`max-w-[720px] ${align === 'center' ? 'mx-auto text-center [&>p]:mx-auto' : 'text-left [&>p]:ml-0'}`}
        >
            {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
            <h2 className="m-0 text-balance text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.12] tracking-[0.025em] text-fg">
                {title}
            </h2>
            {description && (
                <p className="mt-3.5 max-w-[600px] text-[clamp(0.9375rem,2vw,1rem)] leading-[1.65] text-copy">
                    {description}
                </p>
            )}
        </header>
    );
}

interface MarketingSectionProps {
    id: string;
    children: ReactNode;
    tone?: 'default' | 'raised';
    className?: string;
}

export default function MarketingSection({
    id,
    children,
    tone = 'default',
    className = '',
}: MarketingSectionProps) {
    return (
        <section
            id={id}
            className={`relative scroll-mt-20 py-[clamp(64px,8vw,100px)] ${tone === 'raised' ? 'bg-[linear-gradient(180deg,var(--color-primary),var(--color-secondary)_10%,var(--color-secondary)_90%,var(--color-primary))]' : ''} ${className}`}
        >
            <div className="mx-auto w-full max-w-[1240px] px-[clamp(20px,4vw,32px)] min-[940px]:max-[1327px]:pr-[120px]">
                {children}
            </div>
        </section>
    );
}
