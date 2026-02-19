import { Link } from 'react-router-dom';
import { FiBookOpen, FiBookmark, FiShare2, FiTrendingUp } from 'react-icons/fi';

import { formatRelativeDate, isNewsFresh } from '../service/newsService';
import type { NewsItem } from '../type/news.types';

type NewsCardProps = {
    news: NewsItem;
    isRead: boolean;
    onToggleSave: (newsId: string) => void;
    onMarkRead: (newsId: string) => void;
};

const NewsCard = ({
    news,
    isRead,
    onToggleSave,
    onMarkRead,
}: NewsCardProps) => (
    <article
        className={`rounded-xl border border-tertiary bg-secondary p-3 transition hover:-translate-y-1 ${
            isRead ? 'opacity-80' : ''
        }`}
    >
        <div className="relative">
            <img
                src={news.coverImage}
                alt={news.title}
                className="object-cover w-full rounded-lg aspect-video"
            />
            <button
                type="button"
                onClick={() => onToggleSave(news.id)}
                className="absolute p-2 text-white transition rounded-full top-2 right-2 bg-black/40 hover:bg-black/60"
            >
                <FiBookmark />
            </button>
        </div>
        <div className="mt-2 space-y-2">
            <h3 className="font-semibold leading-snug line-clamp-2">
                <Link
                    to={`/Manga-Reader/news/${news.id}`}
                    onClick={() => onMarkRead(news.id)}
                >
                    {news.title}
                </Link>
            </h3>
            <p className="text-sm text-tertiary line-clamp-1">{news.excerpt}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary">
                <span className="inline-flex items-center gap-1">
                    <FiBookOpen /> {news.source}
                </span>
                <span>{formatRelativeDate(news.publishedAt)}</span>
                <span>{news.readTime} min</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="px-2 py-1 text-xs rounded-full bg-primary">
                    {news.category}
                </span>
                <div className="flex items-center gap-2 text-xs">
                    {isNewsFresh(news.publishedAt) && (
                        <span className="px-2 py-1 text-green-300 rounded-full bg-green-800/30">
                            Nova
                        </span>
                    )}
                    {news.trendingScore > 88 && (
                        <span className="inline-flex items-center gap-1 text-orange-300">
                            <FiTrendingUp /> Trending
                        </span>
                    )}
                    <FiShare2 className="text-tertiary" />
                </div>
            </div>
        </div>
    </article>
);

export default NewsCard;
