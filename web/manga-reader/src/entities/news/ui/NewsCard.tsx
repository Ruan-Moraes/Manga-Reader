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
        <article className="group overflow-hidden rounded-mr-xs border border-mr-border bg-mr-surface transition duration-mr-default hover:-translate-y-1 hover:border-mr-accent-50">
            <Link to={ROUTES.NEWS_DETAIL(news.slug || news.id)} className="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-mr-accent">
                <div className="relative aspect-[16/10] overflow-hidden bg-mr-secondary">
                    {news.coverImage && <img src={news.coverImage} alt={news.coverAlt || news.title} className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                        {categoryLabel && <Badge variant="neutral">{categoryLabel}</Badge>}
                        {news.isExclusive && <Badge>{t('hero.exclusive')}</Badge>}
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="text-mr-tiny font-mr-bold uppercase tracking-[0.08em] text-mr-accent">{formatRelativeDate(news.publishedAt)}</p>
                    <h2 className="text-mr-h4 font-mr-extrabold leading-tight tracking-mr text-mr-fg">{news.title}</h2>
                    <p className="line-clamp-3 flex-1 text-mr-small leading-relaxed text-mr-fg-muted">{news.excerpt}</p>
                    <div className="flex items-center justify-between border-t border-mr-border-subtle pt-3 text-mr-tiny text-mr-fg-subtle">
                        <span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{t('card.readMinutes', { count: news.readTime })}</span><span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{news.views.toLocaleString(i18n.language)}</span></span>
                        <ArrowUpRight className="size-4 text-mr-accent" aria-hidden="true" />
                    </div>
                </div>
            </Link>
        </article>
    );
};
export default NewsCard;
