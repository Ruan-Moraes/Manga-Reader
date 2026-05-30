// TODO: Refatorar isso.

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Check, ChevronDown, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import Logo from '@shared/component/logo/Logo.tsx';
import { cn } from '@shared/lib/cn';

export interface FooterLink {
    label: string;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
    external?: boolean;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface FooterAppLink {
    os: 'ios' | 'android';
    label: string;
    osName: string;
    href: string;
    ariaLabel: string;
}

export interface FooterSocialLink {
    name: string;
    href: string;
    icon: LucideIcon;
    ariaLabel: string;
}

export interface FooterStatusInfo {
    title: string;
    meta: string;
    linkLabel?: string;
    href?: string;
    statusAriaLabel?: string;
}

export interface FooterPreferenceItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    value?: string;
    showChevron?: boolean;
    accent?: boolean;
    ariaLabel: string;
    onClick?: () => void;
}

export interface FooterTexts {
    tagline?: string;
    newsletterLabel?: string;
    newsletterPlaceholder?: string;
    newsletterSubmitAria?: string;
    newsletterHint?: string;
    newsletterSuccess?: string;
    appsLabel?: string;
    socialsLabel?: string;
    navAriaLabel?: string;
    expandLabel?: string;
    collapseLabel?: string;
}

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

const DEFAULT_TEXTS: Required<FooterTexts> = {
    tagline: 'Leia, descubra e acompanhe seus mangás, manhwas e manhuas favoritos.',
    newsletterLabel: 'Receba os destaques da semana',
    newsletterPlaceholder: 'seu@email.com',
    newsletterSubmitAria: 'Inscrever-se na newsletter',
    newsletterHint: 'Sem spam. Cancele quando quiser.',
    newsletterSuccess: 'Pronto! Você vai receber os destaques toda sexta.',
    appsLabel: 'Baixe o app',
    socialsLabel: 'Siga nas redes',
    navAriaLabel: 'Rodapé',
    expandLabel: 'Expandir seção',
    collapseLabel: 'Recolher seção',
};

const LINK_CLASSES =
    'group/link relative block py-[7px] pl-3 text-[13px] font-mr-semibold text-[#cccccc] no-underline transition-[color,padding-left] duration-200 ease-mr ' +
    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[10px] before:w-[2px] before:bg-mr-accent before:opacity-0 before:transition-opacity before:duration-200 before:content-[''] " +
    'hover:pl-4 hover:text-mr-accent hover:before:opacity-100 ' +
    'focus-visible:pl-4 focus-visible:text-mr-accent focus-visible:before:opacity-100 focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2 rounded-[2px]';

const COLUMN_DESKTOP_TITLE_CLASSES =
    'relative inline-block pb-[6px] mb-3 text-[11px] font-mr-extrabold uppercase tracking-[0.12em] text-mr-fg ' +
    "after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-6 after:bg-mr-accent after:content-['']";

const noop = () => {};

const FooterColumnBlock = ({
    column,
    isOpen,
    onToggle,
    expandLabel,
    collapseLabel,
}: {
    column: FooterColumn;
    isOpen: boolean;
    onToggle: () => void;
    expandLabel: string;
    collapseLabel: string;
}) => (
    <div className="border-b border-mr-gray-800 md:border-none">
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={isOpen ? `${collapseLabel}: ${column.title}` : `${expandLabel}: ${column.title}`}
            className="flex w-full min-h-[48px] items-center justify-between gap-3 py-3 md:hidden"
        >
            <span className="text-xs font-mr-extrabold uppercase tracking-[0.1rem] pb-[0.125rem] border-b border-mr-tertiary">{column.title}</span>
            <ChevronDown
                aria-hidden="true"
                className="size-4 text-mr-fg-subtle transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
        </button>
        <div aria-hidden="true" className="hidden md:block">
            <span className={COLUMN_DESKTOP_TITLE_CLASSES}>{column.title}</span>
        </div>
        <ul className={cn('flex flex-col gap-[2px] pb-3 md:pb-0 md:flex', !isOpen && 'hidden md:flex')}>
            {column.links.map(l => (
                <li key={`${column.title}-${l.label}`}>
                    <a
                        href={l.href}
                        onClick={l.onClick}
                        rel={l.external ? 'noopener noreferrer' : undefined}
                        target={l.external ? '_blank' : undefined}
                        className={LINK_CLASSES}
                    >
                        {l.label}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

const NewsletterCard = ({ onSubscribe, texts }: { onSubscribe?: (email: string) => void | Promise<void>; texts: Required<FooterTexts> }) => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) return;

        await onSubscribe?.(email);
        await onSubscribe?.(email);

        setEmail('');
        setSent(true);
    };

    return (
        <div className="w-full rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-4" style={{ background: 'var(--mr-secondary)' }}>
            <span className="text-xs font-mr-extrabold uppercase tracking-[0.1rem] block mb-2">{texts.newsletterLabel}</span>
            {sent ? (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-mr-xs border px-3 py-2 text-[12px] font-mr-semibold"
                    style={{
                        background: 'var(--mr-accent-25)',
                        borderColor: 'var(--mr-accent-50)',
                        color: 'var(--mr-accent)',
                    }}
                >
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                    <span>{texts.newsletterSuccess}</span>
                </div>
            ) : (
                <form className="flex items-stretch gap-2" onSubmit={handleSubmit} noValidate>
                    <input
                        type="email"
                        required
                        aria-label="Email"
                        placeholder={texts.newsletterPlaceholder}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="h-11 min-w-0 flex-1 rounded-[2px] border border-mr-tertiary bg-transparent px-3 text-[13px] text-mr-fg outline-none transition-colors duration-200 placeholder:text-mr-fg-subtle focus:border-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
                    />
                    <button
                        type="submit"
                        aria-label={texts.newsletterSubmitAria}
                        className="inline-flex size-11 shrink-0 items-center justify-center rounded-[2px] bg-mr-accent text-mr-primary transition-opacity duration-200 hover:opacity-[0.85] focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
                    >
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                </form>
            )}
            {!sent && <p className="mt-2 text-[11px] text-mr-fg-subtle">{texts.newsletterHint}</p>}
        </div>
    );
};

const AppButton = ({ app }: { app: FooterAppLink }) => (
    <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={app.ariaLabel}
        className="flex-1 inline-flex items-center gap-2 rounded-[2px] border border-mr-gray-700 bg-mr-secondary px-3 py-2 no-underline transition-colors duration-200 hover:border-mr-accent"
    >
        <Download className="size-4 text-mr-fg-subtle" aria-hidden="true" />
        <span className="flex flex-col text-left leading-tight ">
            <span className="text-[10px] uppercase tracking-[1px] text-mr-fg-subtle">{app.label}</span>
            <span className="text-[12px] font-mr-bold text-mr-fg">{app.osName}</span>
        </span>
    </a>
);

const SocialButton = ({ social }: { social: FooterSocialLink }) => {
    const Icon = social.icon;

    return (
        <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.ariaLabel}
            className="inline-flex size-10 items-center justify-center rounded-[2px] border border-mr-gray-700 bg-mr-secondary text-mr-fg-muted no-underline transition-colors duration-200 hover:border-mr-accent hover:text-mr-accent focus-visible:border-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
        >
            <Icon className="size-[18px]" aria-hidden="true" />
        </a>
    );
};

const PreferenceButton = ({ item }: { item: FooterPreferenceItem }) => {
    const Icon = item.icon;
    const accent = item.accent;

    return (
        <button
            type="button"
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            className={cn(
                'inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[12px] font-mr-semibold transition-colors duration-200',
                'focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2',
                accent
                    ? 'border-transparent bg-transparent text-mr-accent'
                    : 'border-mr-gray-700 bg-transparent text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
            )}
        >
            {Icon && <Icon className="size-[14px]" aria-hidden="true" />}
            <span>{item.label}</span>
            {item.value && <span className="text-mr-fg">{item.value}</span>}
            {item.showChevron && <ChevronDown className="size-[14px]" aria-hidden="true" />}
        </button>
    );
};

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
