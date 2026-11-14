import { useParams } from 'react-router-dom';
import { ArrowLeft, Eye, ThumbsUp, ChevronRight, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { ROUTES } from '@shared/constant/ROUTES';

import { PageContainer } from '@ui/PageContainer';
import { Badge } from '@ui/Badge';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { SectionHeader } from '@ui/SectionHeader';

import { ARTICLES, fmt } from './parts/helpData';

export default function HelpArticle() {
    const { articleId } = useParams<{ articleId: string }>();

    const navigate = useAppNavigate();

    const { t } = useTranslation('help');

    const article = ARTICLES.find(a => a.id === articleId);

    if (!article) {
        return (
            <PageContainer asMain paddingY="lg" className="flex min-h-[60vh] items-center justify-center">
                <EmptyState
                    illustration="duvida"
                    title={t('article.notFoundTitle')}
                    description={t('article.notFoundDesc')}
                    action={
                        <Button variant="primary" icon={ArrowLeft} onClick={() => navigate(ROUTES.HELP)}>
                            {t('article.back')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    const paragraphs = t(`articleBody.${article.id}`, { returnObjects: true });
    const body = Array.isArray(paragraphs) ? (paragraphs as string[]) : [];

    const related = ARTICLES.filter(a => a.cat === article.cat && a.id !== article.id);

    return (
        <div>
            <div className="border-b border-ui-border-subtle bg-ui-secondary py-8 sm:py-10">
                <PageContainer size="default">
                    <button
                        type="button"
                        onClick={() => navigate(ROUTES.HELP)}
                        className="mb-4 inline-flex items-center gap-1.5 rounded-ui-xs text-ui-small font-ui-bold text-ui-fg-muted transition-colors hover:text-ui-accent-fg"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {t('article.back')}
                    </button>

                    <div className="mb-3">
                        <Badge variant="accent">{t(`categories.${article.cat}.label`)}</Badge>
                    </div>

                    <h1 className="text-ui-h1 font-ui-extrabold tracking-mr text-ui-fg">{t(`items.${article.id}`)}</h1>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-ui-tiny text-ui-fg-subtle">
                        <span className="inline-flex items-center gap-1">
                            <Eye className="size-3.5" aria-hidden="true" />
                            {t('article.views', { value: fmt(article.views) })}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <ThumbsUp className="size-3.5" aria-hidden="true" />
                            {t('articles.helpful', { percent: article.helpful })}
                        </span>
                    </div>
                </PageContainer>
            </div>

            <PageContainer asMain size="default" paddingY="lg">
                <article className="flex flex-col gap-4 text-ui-body leading-relaxed text-ui-fg-muted">
                    {body.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                </article>

                <section className="mt-10 rounded-ui-xs border border-ui-border bg-ui-surface p-5">
                    <p className="mb-3 text-ui-body font-ui-bold text-ui-fg">{t('article.helpfulTitle')}</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" icon={ThumbsUp}>
                            {t('article.yes')}
                        </Button>
                        <Button variant="ghost" onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                            {t('article.no')}
                        </Button>
                    </div>
                </section>

                {related.length > 0 && (
                    <section className="mt-10">
                        <SectionHeader title={t('article.relatedTitle')} as="h2" size="sm" className="mb-4" />
                        <div className="flex flex-col divide-y divide-ui-border-subtle overflow-hidden rounded-ui-xs border border-ui-border">
                            {related.map(a => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => navigate(ROUTES.HELP_ARTICLE(a.id))}
                                    className="flex items-center gap-3 bg-ui-surface px-4 py-3 text-left transition-colors hover:bg-ui-accent-25"
                                >
                                    <span className="min-w-0 flex-1 truncate text-ui-body font-ui-bold text-ui-fg">{t(`items.${a.id}`)}</span>
                                    <ChevronRight className="size-4 shrink-0 text-ui-fg-subtle" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mt-10 flex flex-col items-start gap-3 rounded-ui-xs border border-ui-border-subtle bg-ui-secondary p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-ui-body font-ui-extrabold text-ui-fg">{t('contact.title')}</p>
                        <p className="text-ui-small text-ui-fg-muted">{t('contact.eyebrow')}</p>
                    </div>
                    <Button variant="primary" icon={MessageCircle} onClick={() => navigate(ROUTES.LEGAL_CONTACT)}>
                        {t('contact.openTicket')}
                    </Button>
                </section>
            </PageContainer>
        </div>
    );
}
