import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { FileText, Shield, Copyright, Mail } from 'lucide-react';
import { PageContainer } from '@ui/PageContainer';
import { Badge } from '@ui/Badge';
import { cn } from '@shared/lib/cn';
import type { ReactNode } from 'react';

type LegalPage = 'terms' | 'privacy' | 'dmca' | 'contact';

export interface TocItem {
    id: string;
    label: string;
}

export interface LegalShellProps {
    page: LegalPage;
    eyebrow?: string;
    title: string;
    sub?: string;
    updated?: string;
    version?: string;
    toc?: TocItem[] | null;
    children: ReactNode;
}

const TAB_META: { key: LegalPage; icon: typeof FileText; path: string }[] = [
    { key: 'terms', icon: FileText, path: '/legal/terms' },
    { key: 'privacy', icon: Shield, path: '/legal/privacy' },
    { key: 'dmca', icon: Copyright, path: '/legal/dmca' },
    { key: 'contact', icon: Mail, path: '/legal/contact' },
];

function useScrollSpy(ids: string[]) {
    const [active, setActive] = useState(ids[0] ?? '');

    const idKey = ids.join(',');
    const update = useCallback(() => {
        const observer = new IntersectionObserver(
            entries => {
                const visible = entries.find(e => e.isIntersecting);
                if (visible) setActive(visible.target.id);
            },
            { rootMargin: '-30% 0px -60% 0px' },
        );
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idKey]);

    useEffect(() => update(), [update]);
    return active;
}

function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

export const LegalShell = ({
    page,
    eyebrow,
    title,
    sub,
    updated,
    version,
    toc,
    children,
}: LegalShellProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('legal');
    const tocIds = toc?.map(it => it.id) ?? [];
    const activeId = useScrollSpy(tocIds);

    const resolvedEyebrow = eyebrow ?? t('shell.eyebrow');

    return (
        <div>
            {/* Hero */}
            <div className="border-b border-mr-border-subtle bg-mr-secondary py-8 sm:py-10">
                <PageContainer>
                    <p className="mr-label mb-2 text-mr-accent">
                        {resolvedEyebrow}
                    </p>
                    <h1 className="text-mr-h1 font-mr-extrabold tracking-mr text-mr-fg">
                        {title}
                    </h1>
                    {sub && (
                        <p className="mt-2 max-w-2xl text-mr-body text-mr-fg-muted">
                            {sub}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {updated && (
                            <Badge variant="neutral">
                                {t('shell.updated', { date: updated })}
                            </Badge>
                        )}
                        {version && (
                            <Badge variant="neutral">{version}</Badge>
                        )}
                        <Badge variant="neutral">{t('shell.language')}</Badge>
                    </div>

                    {/* Doc tabs */}
                    <nav
                        aria-label={t('shell.tabsAriaLabel')}
                        className="mt-6 flex gap-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {TAB_META.map(tab => {
                            const Icon = tab.icon;
                            const active = tab.key === page;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => navigate(tab.path)}
                                    className={cn(
                                        'inline-flex shrink-0 items-center gap-1.5 rounded-mr-xs px-3 py-2 text-mr-small font-mr-bold transition-colors',
                                        active
                                            ? 'bg-mr-accent text-mr-primary'
                                            : 'text-mr-fg-muted hover:bg-mr-accent-25 hover:text-mr-fg',
                                    )}
                                >
                                    <Icon className="size-3.5" />
                                    {t(`shell.tabs.${tab.key}`)}
                                </button>
                            );
                        })}
                    </nav>
                </PageContainer>
            </div>

            {/* Body */}
            <PageContainer asMain paddingY="lg">
                {toc && toc.length > 0 ? (
                    <div className="flex gap-10">
                        {/* TOC mobile chips */}
                        <nav
                            aria-label={t('shell.tocAriaLabel')}
                            className="mb-6 flex gap-2 overflow-x-auto [scrollbar-width:none] lg:hidden"
                        >
                            {toc.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollTo(item.id)}
                                    className={cn(
                                        'shrink-0 rounded-mr-full border px-3 py-1 text-mr-tiny font-mr-bold transition-colors',
                                        activeId === item.id
                                            ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                            : 'border-mr-border text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* TOC desktop sidebar */}
                        <aside
                            aria-label={t('shell.tocAriaLabel')}
                            className="hidden w-[260px] shrink-0 lg:block"
                        >
                            <div className="sticky top-24 flex flex-col gap-0.5">
                                <p className="mr-label mb-3 text-mr-fg-subtle">
                                    {t('shell.tocHeading')}
                                </p>
                                {toc.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => scrollTo(item.id)}
                                        className={cn(
                                            'rounded-mr-xs px-3 py-2 text-left text-mr-small transition-colors',
                                            activeId === item.id
                                                ? 'bg-mr-accent-25 font-mr-bold text-mr-accent'
                                                : 'text-mr-fg-muted hover:text-mr-fg',
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="min-w-0 flex-1 divide-y divide-mr-border-subtle">
                            {children}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto">{children}</div>
                )}
            </PageContainer>
        </div>
    );
};

export default LegalShell;
