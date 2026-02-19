import { useEffect, useMemo, useState } from 'react';

import { getNewsById, getRelatedNews } from '../service/newsService';

const useNewsDetails = (newsId: string | undefined) => {
    const news = newsId ? getNewsById(newsId) : undefined;

    const [commentSort, setCommentSort] = useState<'recent' | 'relevant'>(
        'recent',
    );
    const [showSpoilers, setShowSpoilers] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);

    const relatedNews = useMemo(
        () => (news ? getRelatedNews(news) : []),
        [news],
    );

    const sortedComments = useMemo(() => {
        if (!news) {
            return [];
        }

        return [...news.comments].sort((a, b) => {
            if (commentSort === 'relevant') {
                return b.likes - a.likes;
            }

            return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
        });
    }, [commentSort, news]);

    useEffect(() => {
        if (!news) {
            return undefined;
        }

        const handleScroll = () => {
            const pageHeight = document.body.scrollHeight - window.innerHeight;
            const progress =
                pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;
            setReadingProgress(
                Math.min(100, Math.max(0, Math.round(progress))),
            );
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, [news]);

    return {
        news,
        commentSort,
        setCommentSort,
        showSpoilers,
        setShowSpoilers,
        readingProgress,
        relatedNews,
        sortedComments,
    };
};

export default useNewsDetails;
