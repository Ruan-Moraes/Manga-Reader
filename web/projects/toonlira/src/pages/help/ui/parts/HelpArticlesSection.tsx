import { ROUTES } from '@shared/constant/ROUTES';
import { MessageCircle, ChevronRight, Eye, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { SectionHeader } from '@ui/SectionHeader';
import { Badge } from '@ui/Badge';
import { Card } from '@ui/Card';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';

import { CATEGORIES, ARTICLES, fmt } from './helpData';

type HelpArticlesSectionProps = {
    query: string;
    activeCategory: string | null;
    onCategoryToggle: (slug: string) => void;
};

const HelpArticlesSection = ({ query, activeCategory, onCategoryToggle }: HelpArticlesSectionProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('help');
    const hasQuery = query.length > 0;

    const filtered = ARTICLES.filter(a => {
        if (activeCategory && a.cat !== activeCategory) return false;
        if (query && !t(`items.${a.id}`).toLowerCase().includes(query.toLowerCase())) return false;
        return true;
    });

    return (
        <>
            <section className="mb-12">
                <SectionHeader eyebrow={t('articles.categoriesEyebrow')} title={t('articles.categoriesTitle')} className="mb-6" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {CATEGORIES.map(cat => {
                        const Icon = cat.icon;
                        const active = activeCategory === cat.slug;
                        return (
                            <Card
                                key={cat.slug}
                                interactive
                                variant="default"
                                onClick={() => onCategoryToggle(cat.slug)}
                                className={active ? 'border-ui-accent-border bg-ui-accent-25/30' : ''}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex size-10 shrink-0 items-center justify-center rounded-ui-xs transition-colors ${active ? 'bg-ui-accent text-ui-on-accent' : 'bg-ui-accent-25 text-ui-accent-fg'}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-ui-extrabold text-ui-fg">{t(`categories.${cat.slug}.label`)}</div>
                                        <div className="truncate text-ui-tiny text-ui-fg-muted">{t(`categories.${cat.slug}.desc`)}</div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <Badge variant="neutral">
                                        {t('articles.articlesCount', {
                                            count: cat.count,
                                        })}
                                    </Badge>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="mb-12">
                <SectionHeader
                    eyebrow={hasQuery ? t('articles.resultsEyebrow', { query }) : t('articles.popularEyebrow')}
                    title={
                        hasQuery
                            ? t('articles.resultsTitle', {
                                  count: filtered.length,
                              })
                            : t('articles.popularTitle')
                    }
                    className="mb-6"
                />
                {filtered.length === 0 ? (
                    <EmptyState
                        illustration="duvida"
                        title={t('articles.emptyTitle', { query })}
                        description={t('articles.emptyDesc')}
                        action={
                            <Button variant="primary" icon={MessageCircle} onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                                {t('articles.openTicket')}
                            </Button>
                        }
                    />
                ) : (
                    <div className="flex flex-col divide-y divide-ui-border-subtle rounded-ui-xs border border-ui-border overflow-hidden">
                        {filtered.map((article, idx) => (
                            <article
                                key={article.id}
                                className="flex cursor-pointer items-center gap-4 bg-ui-surface px-4 py-4 transition-colors hover:bg-ui-accent-25"
                                onClick={() => navigate(ROUTES.HELP_ARTICLE(article.id))}
                            >
                                <span className="shrink-0 font-ui-mono text-ui-small font-ui-extrabold tabular-nums text-ui-accent-fg">
                                    {String(idx + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1">
                                        <Badge variant="neutral">{t(`categories.${article.cat}.label`)}</Badge>
                                    </div>
                                    <p className="truncate text-ui-body font-ui-bold text-ui-fg">{t(`items.${article.id}`)}</p>
                                    <div className="mt-1 flex gap-3 text-ui-tiny text-ui-fg-subtle">
                                        <span className="inline-flex items-center gap-1">
                                            <Eye className="size-3" />
                                            {fmt(article.views)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <ThumbsUp className="size-3" />
                                            {t('articles.helpful', {
                                                percent: article.helpful,
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 shrink-0 text-ui-fg-subtle" />
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default HelpArticlesSection;
