import { Link } from 'react-router-dom';

import { formatRelativeDate } from '../service/newsService';
import type { NewsItem } from '../type/news.types';

type HeroNewsProps = {
    news: NewsItem;
};

const HeroNews = ({ news }: HeroNewsProps) => (
    <Link
        to={`/Manga-Reader/news/${news.id}`}
        className="block overflow-hidden transition border rounded-2xl border-tertiary bg-secondary hover:-translate-y-1"
    >
        <div className="relative">
            <img
                src={news.coverImage}
                alt={news.title}
                className="object-cover w-full aspect-video"
            />
            <span className="absolute px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full left-4 top-4">
                {news.isExclusive ? 'Exclusivo' : 'Destaque'}
            </span>
        </div>
        <div className="p-4 space-y-2">
            <p className="text-xs text-purple-300">{news.category}</p>
            <h2 className="text-2xl font-bold line-clamp-3">{news.title}</h2>
            <p className="text-sm text-tertiary line-clamp-3">{news.excerpt}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-tertiary">
                <span>{news.author.name}</span>
                <span>{formatRelativeDate(news.publishedAt)}</span>
                <span>{news.readTime} min</span>
                <span>{news.views.toLocaleString('pt-BR')} views</span>
            </div>
        </div>
    </Link>
);

export default HeroNews;
