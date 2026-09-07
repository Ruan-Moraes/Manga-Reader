import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { AlertTriangle, FileText, Shield, Copyright, Mail } from 'lucide-react';
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
        // `ids` é lido aqui, mas a dep correta é o seu *conteúdo* (`idKey`), não a
        // identidade do array (que muda a cada render). Reexecutar por identidade
        // recriaria o IntersectionObserver sem necessidade. Omissão intencional.
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

export const LegalShell = ({ page, eyebrow, title, sub, updated, version, toc, children }: LegalShellProps) => {
    const navigate = useAppNavigate();

    const { t } = useTranslation('legal');

    const tocIds = toc?.map(it => it.id) ?? [];

    const activeId = useScrollSpy(tocIds);

    const resolvedEyebrow = eyebrow ?? t('shell.eyebrow');

    return (
        <div>
            {/* Hero */}
            <div className="border-b border-ui-border-subtle bg-ui-secondary py-8 sm:py-10">
                <PageContainer>
                    <p className="ui-label mb-2 text-ui-accent-fg">{resolvedEyebrow}</p>
                    <h1 className="text-ui-h1 font-ui-extrabold tracking-mr text-ui-fg">{title}</h1>
                    {sub && <p className="mt-2 max-w-2xl text-ui-body text-ui-fg-muted">{sub}</p>}

                    {/* Meta */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {updated && <Badge variant="neutral">{t('shell.updated', { date: updated })}</Badge>}
                        {version && <Badge variant="neutral">{version}</Badge>}
                        <Badge variant="neutral">{t('shell.language')}</Badge>
                    </div>

                    <div
                        role="note"
                        aria-label={t('shell.draft.title')}
                        className="mt-5 flex max-w-2xl gap-3 rounded-ui-sm border border-ui-danger-border bg-ui-danger-15 p-4"
                    >
                        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ui-danger" />
                        <div className="min-w-0">
                            <p className="text-ui-small font-ui-extrabold text-ui-danger">{t('shell.draft.title')}</p>
                            <p className="mt-1 text-ui-small text-ui-fg-muted">{t('shell.draft.description')}</p>
                        </div>
                    </div>

                    {/* Doc tabs */}
                    <nav aria-label={t('shell.tabsAriaLabel')} className="mt-6 flex w-full flex-wrap gap-1">
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
                                        'inline-flex max-w-full items-center gap-1.5 rounded-ui-xs px-3 py-2 text-ui-small font-ui-bold transition-colors',
                                        active ? 'bg-ui-accent text-ui-on-accent' : 'text-ui-fg-muted hover:bg-ui-accent-25 hover:text-ui-fg',
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
                    <div className="flex min-w-0 flex-col gap-6 lg:gap-10 lg:flex-row">
                        {/* TOC mobile chips */}
                        <nav aria-label={t('shell.tocAriaLabel')} className="mb-0 flex w-full min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] lg:hidden">
                            {toc.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => scrollTo(item.id)}
                                    className={cn(
                                        'shrink-0 rounded-ui-full border px-3 py-1 text-ui-tiny font-ui-bold transition-colors',
                                        activeId === item.id
                                            ? 'border-ui-accent-border bg-ui-accent text-ui-on-accent'
                                            : 'border-ui-border text-ui-fg-muted hover:border-ui-accent-border hover:text-ui-accent-fg',
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* TOC desktop sidebar */}
                        <aside aria-label={t('shell.tocAriaLabel')} className="hidden w-[260px] shrink-0 lg:block">
                            <div className="sticky top-24 flex flex-col gap-0.5">
                                <p className="ui-label mb-3 text-ui-fg-subtle">{t('shell.tocHeading')}</p>
                                {toc.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => scrollTo(item.id)}
                                        className={cn(
                                            'rounded-ui-xs px-3 py-2 text-left text-ui-small transition-colors',
                                            activeId === item.id ? 'bg-ui-accent-25 font-ui-bold text-ui-accent-fg' : 'text-ui-fg-muted hover:text-ui-fg',
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </aside>

                        <div className="w-full min-w-0 flex-1 divide-y divide-ui-border-subtle">{children}</div>
                    </div>
                ) : (
                    <div className="mx-auto min-w-0">{children}</div>
                )}
            </PageContainer>
        </div>
    );
};

export default LegalShell;
