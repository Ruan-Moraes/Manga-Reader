import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface LegalSectionProps {
    id: string;
    num: number;
    title: string;
    tldr?: string;
    children: ReactNode;
    className?: string;
}

export const LegalSection = ({
    id,
    num,
    title,
    tldr,
    children,
    className,
}: LegalSectionProps) => {
    const { t } = useTranslation('legal');

    return (
        <section id={id} className={cn('scroll-mt-24 py-8', className)}>
            <h2 className="flex items-baseline gap-3 text-mr-h3 font-mr-extrabold tracking-mr text-mr-fg">
                <span className="font-mr-mono text-mr-small text-mr-accent tabular-nums">
                    {String(num).padStart(2, '0')}
                </span>
                {title}
            </h2>

            {tldr && (
                <aside className="mt-4 rounded-mr-sm border border-mr-accent/30 border-l-[3px] border-l-mr-accent bg-mr-accent-25/30 p-4">
                    <p className="text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-accent">
                        {t('section.tldrLabel')}
                    </p>
                    <p className="mt-1 text-mr-small text-mr-fg-muted leading-relaxed">
                        {tldr}
                    </p>
                </aside>
            )}

            <div className="prose-legal mt-4 flex flex-col gap-3 text-mr-body leading-relaxed text-mr-fg-muted">
                {children}
            </div>
        </section>
    );
};

export default LegalSection;
