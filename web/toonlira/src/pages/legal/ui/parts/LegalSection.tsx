import { cn } from '@shared/lib/cn';
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

export const LegalSection = ({ id, num, title, tldr, children, className }: LegalSectionProps) => {
    const { t } = useTranslation('legal');

    return (
        <section id={id} className={cn('scroll-mt-24 first:pt-0 py-8', className)}>
            <h2 className="flex min-w-0 items-baseline gap-3 break-words text-ui-h3 font-ui-extrabold tracking-mr text-ui-fg">
                <span className="shrink-0 font-ui-mono text-ui-small text-ui-accent-fg tabular-nums">{String(num).padStart(2, '0')}</span>
                {title}
            </h2>

            {tldr && (
                <div className="mt-4 min-w-0 rounded-ui-sm border border-ui-accent-border/30 border-l-[3px] border-l-ui-accent bg-ui-accent-25/30 p-4">
                    <p className="text-ui-tiny font-ui-extrabold uppercase tracking-[0.1em] text-ui-accent-fg">{t('section.tldrLabel')}</p>
                    <p className="mt-1 text-ui-small text-ui-fg-muted leading-relaxed">{tldr}</p>
                </div>
            )}

            <div className="prose-legal mt-4 flex min-w-0 flex-col gap-3 break-words text-ui-body leading-relaxed text-ui-fg-muted">{children}</div>
        </section>
    );
};

export default LegalSection;
