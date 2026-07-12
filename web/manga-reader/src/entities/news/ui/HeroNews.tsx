import { ArrowRight, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import { Badge } from '@ui/Badge';
import type { NewsSummary } from '../model/news.types';
import { formatRelativeDate } from '../api/newsService';

const HeroNews = ({ news }: { news: NewsSummary }) => {
    const { t, i18n } = useTranslation('news');
    const categoryLabel = typeof news.category === 'string' ? news.category : news.category?.label;
    return (
        <article className="overflow-hidden rounded-mr-xs border border-mr-border bg-mr-surface">
            <Link to={ROUTES.NEWS_DETAIL(news.slug || news.id)} className="group grid lg:grid-cols-[1.35fr_1fr]">
                <div className="relative min-h-64 overflow-hidden bg-mr-secondary lg:min-h-[430px]">
                    {news.coverImage && <img src={news.coverImage} alt={news.coverAlt || news.title} className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.02]" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" />
                </div>
                <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2">{news.isFeatured && <Badge>{t('page.pinnedLabel')}</Badge>}{categoryLabel && <Badge variant="neutral">{categoryLabel}</Badge>}</div>
                    <p className="text-mr-tiny font-mr-bold uppercase tracking-[0.1em] text-mr-accent">{formatRelativeDate(news.publishedAt)}</p>
                    <h1 className="text-mr-h2 font-mr-extrabold leading-[1.05] tracking-mr text-mr-fg lg:text-[2.75rem]">{news.title}</h1>
                    <p className="text-mr-body leading-relaxed text-mr-fg-muted">{news.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-4 text-mr-small text-mr-fg-subtle"><span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{t('card.readMinutes', { count: news.readTime })}</span><span className="inline-flex items-center gap-1.5"><Eye className="size-4" />{news.views.toLocaleString(i18n.language)}</span></div>
                    <span className="inline-flex items-center gap-2 font-mr-bold text-mr-accent">{t('page.readMore')}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
                </div>
            </Link>
        </article>
    );
};
export default HeroNews;
