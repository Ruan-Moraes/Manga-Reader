import { useEffect, useState } from 'react';

import { getNewsById, getRelatedNews } from '../api/newsService';
import type { NewsItem } from '../model/news.types';

const useNewsDetails = (newsId: string | undefined) => {
    const [news, setNews] = useState<NewsItem | undefined>();
    const [relatedNews, setRelatedNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(!!newsId);

    useEffect(() => {
        if (!newsId) {
            setNews(undefined);
            setRelatedNews([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        getNewsById(newsId)
            .then(setNews)
            .catch(() => setNews(undefined))
            .finally(() => setIsLoading(false));
    }, [newsId]);

    useEffect(() => {
        if (!news) {
            setRelatedNews([]);
            return;
        }

        getRelatedNews(news.id)
            .then(setRelatedNews)
            .catch(() => setRelatedNews([]));
    }, [news]);

    const [readingProgress, setReadingProgress] = useState(0);

    useEffect(() => {
        if (!news) {
            return undefined;
        }

        const handleScroll = () => {
            const pageHeight = document.body.scrollHeight - window.innerHeight;
            const progress = pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
            setReadingProgress(Math.min(100, Math.max(0, Math.round(progress))));
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [news]);

    return {
        news,
        isLoading,
        readingProgress,
        relatedNews,
    };
};

export default useNewsDetails;
