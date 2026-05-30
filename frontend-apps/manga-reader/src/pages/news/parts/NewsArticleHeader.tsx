import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@ui/Avatar';
import { formatNewsDate, formatRelativeDate } from '@entities/news';
import type { NewsItem } from '@entities/news';
import { Clock, Eye } from 'lucide-react';

type NewsArticleHeaderProps = {
    news: NewsItem;
};

const NewsArticleHeader = ({ news }: NewsArticleHeaderProps) => {
    const { t, i18n } = useTranslation('news');

    return (
        <header className="overflow-hidden border rounded-2xl border-tertiary bg-secondary">
            <img src={news.coverImage} alt={news.title} className="object-cover w-full aspect-[16/7]" />
            <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-2 py-1 text-purple-200 rounded-full bg-purple-600/20">
                        {t(`tabs.${news.category}`, {
                            defaultValue: news.category,
                        })}
                    </span>
                    <span>{formatNewsDate(news.publishedAt)}</span>
                    <span className="inline-flex items-center gap-1">
                        <Clock /> {t('card.readMinutes', { count: news.readTime })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <Eye /> {news.views.toLocaleString(i18n.language)}
                    </span>
                </div>
                <h1 className="text-3xl font-bold">{news.title}</h1>
                <p className="text-lg text-tertiary">{news.subtitle}</p>
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-primary">
                    <div className="flex items-center gap-3">
                        <Avatar src={news.author.avatar} name={news.author.name} size={40} shape="circle" />
                        <div>
                            <Link to={news.author.profileLink} className="font-medium underline">
                                {news.author.name}
                            </Link>
                            <p className="text-xs text-tertiary">{news.author.role}</p>
                        </div>
                    </div>
                    <div className="text-sm text-right text-tertiary">
                        <p>{news.source}</p>
                        {news.updatedAt && (
                            <p>
                                {t('details.updated', {
                                    date: formatRelativeDate(news.updatedAt),
                                })}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default NewsArticleHeader;
