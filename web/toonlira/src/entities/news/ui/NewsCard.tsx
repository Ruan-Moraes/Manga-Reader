import { Clock, Eye, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { Badge } from '@ui/Badge';
import { formatRelativeDate } from '../api/newsService';
import type { NewsSummary } from '../model/news.types';

const NewsCard = ({ news }: { news: NewsSummary }) => {
    const { t, i18n } = useTranslation('news');
    const categoryLabel = typeof news.category === 'string' ? news.category : news.category?.label;
    return (
        <article className="group overflow-hidden rounded-ui-xs border border-ui-border bg-ui-surface transition duration-ui-default hover:-translate-y-1 hover:border-ui-accent-50">
            <Link to={ROUTES.NEWS_DETAIL(news.slug || news.id)} className="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-ui-focus-ring">
                <div className="relative aspect-[16/10] overflow-hidden bg-ui-secondary">
                    {news.coverImage && <img src={news.coverImage} alt={news.coverAlt || news.title} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                        {categoryLabel && <Badge variant="neutral">{categoryLabel}</Badge>}
                        {news.isExclusive && <Badge>{t('hero.exclusive')}</Badge>}
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="text-ui-tiny font-ui-bold uppercase tracking-[0.08em] text-ui-accent-fg">{formatRelativeDate(news.publishedAt)}</p>
                    <h2 className="text-ui-h4 font-ui-extrabold leading-tight tracking-mr text-ui-fg">{news.title}</h2>
                    <p className="line-clamp-3 flex-1 text-ui-small leading-relaxed text-ui-fg-muted">{news.excerpt}</p>
                    <div className="flex items-center justify-between border-t border-ui-border-subtle pt-3 text-ui-tiny text-ui-fg-subtle">
                        <span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{t('card.readMinutes', { count: news.readTime })}</span><span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{news.views.toLocaleString(i18n.language)}</span></span>
                        <ArrowUpRight className="size-4 text-ui-accent-fg" aria-hidden="true" />
                    </div>
                </div>
            </Link>
        </article>
    );
};
export default NewsCard;
