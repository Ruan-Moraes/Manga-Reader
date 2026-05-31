import { useState } from 'react';
import type { ReactNode } from 'react';

import Logo from '@shared/component/logo/Logo.tsx';
import { cn } from '@shared/lib/cn';

import { AppButton, PreferenceButton, SocialButton } from './footer/FooterButtons';
import { FooterColumnBlock } from './footer/FooterColumnBlock';
import { NewsletterCard } from './footer/NewsletterCard';
import { DEFAULT_TEXTS } from './footer/footer.types';
import type {
    FooterAppLink,
    FooterColumn,
    FooterPreferenceItem,
    FooterSocialLink,
    FooterStatusInfo,
    FooterTexts,
} from './footer/footer.types';

export type {
    FooterAppLink,
    FooterColumn,
    FooterLink,
    FooterPreferenceItem,
    FooterSocialLink,
    FooterStatusInfo,
    FooterTexts,
} from './footer/footer.types';

export interface FooterProps {
    columns: FooterColumn[];
    onSubscribe?: (email: string) => void | Promise<void>;
    copyright?: string;
    statusInfo?: FooterStatusInfo;
    status?: ReactNode;
    apps?: FooterAppLink[];
    socials?: FooterSocialLink[];
    preferenceItems?: FooterPreferenceItem[];
    preferences?: ReactNode;
    onBrandNavigate?: (path: string) => void;
    texts?: FooterTexts;
}

const noop = () => {};

export const Footer = ({ columns, onSubscribe, copyright, apps, socials, preferenceItems, preferences, onBrandNavigate, texts }: FooterProps) => {
    const t = { ...DEFAULT_TEXTS, ...(texts ?? {}) } satisfies Required<FooterTexts>;

    const [openIndex, setOpenIndex] = useState(0);

    return (
        <footer
            className="tracking-mr"
            style={{
                background: 'var(--mr-primary)',
                borderTop: '1px solid #242424',
            }}
        >
            <div className="mx-auto max-w-mr-container px-6 pt-10">
                <div className="grid gap-10 lg:grid-cols-[minmax(300px,1fr)_2fr] lg:gap-7">
                    <div className="flex min-w-0 flex-col gap-2">
                        <Logo onNavigate={onBrandNavigate ?? noop} />
                        <p className="text-sm leading-relaxed text-mr-fg-subtle">{t.tagline}</p>
                        <NewsletterCard onSubscribe={onSubscribe} texts={t} />
                        {apps && apps.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {apps.map(a => (
                                    <AppButton key={a.os} app={a} />
                                ))}
                            </div>
                        )}
                        {socials && socials.length > 0 && (
                            <div className="flex flex-col gap-2 mt-4">
                                <span className="block text-xs font-mr-bold uppercase tracking-[0.1rem] pb-1 border-b border-mr-tertiary">
                                    {t.socialsLabel}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {socials.map(s => (
                                        <SocialButton key={s.name} social={s} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <nav
                        aria-label={t.navAriaLabel}
                        className={cn(
                            'grid grid-cols-1 gap-x-5 gap-y-0',
                            'md:grid-cols-3 md:gap-x-7 md:gap-y-8',
                            'lg:grid-cols-3 lg:gap-x-10 lg:gap-y-10',
                            '[&>*]:md:relative [&>*]:md:pl-4',
                            "[&>*]:md:before:absolute [&>*]:md:before:left-0 [&>*]:md:before:top-0 [&>*]:md:before:h-full [&>*]:md:before:w-px [&>*]:md:before:bg-mr-gray-800 [&>*]:md:before:content-['']",
                            '[&>*:nth-child(3n+1)]:md:pl-0 [&>*:nth-child(3n+1)]:md:before:hidden',
                        )}
                    >
                        {columns.map((col, idx) => (
                            <FooterColumnBlock
                                key={col.title}
                                column={col}
                                isOpen={openIndex === idx}
                                onToggle={() => setOpenIndex(prev => (prev === idx ? -1 : idx))}
                                expandLabel={t.expandLabel}
                                collapseLabel={t.collapseLabel}
                            />
                        ))}
                    </nav>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 py-[22px]" style={{ borderTop: '1px solid var(--mr-gray-800)' }}>
                    <div className="text-[12px] text-mr-fg-subtle">
                        {copyright ?? `© ${new Date().getFullYear()} Manga Reader. Feito por Ruan — projeto de estudo.`}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {preferenceItems?.map(p => <PreferenceButton key={p.key} item={p} />)}
                        {preferences}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
