import { useCallback, useEffect, useMemo, useState } from 'react';

import { filterNews, getNewsSources } from '../service/newsService';
import type { NewsCategory, NewsItem } from '../type/news.types';

const tabs: Array<'Principais' | NewsCategory> = [
    'Principais',
    'Lançamentos',
    'Adaptações',
    'Indústria',
    'Eventos',
    'Curiosidades',
];

const myNewsTabs = ['Salvas', 'Lidas', 'Recomendadas'] as const;

type MyNewsTab = (typeof myNewsTabs)[number];

const useNews = () => {
    const [activeTab, setActiveTab] =
        useState<(typeof tabs)[number]>('Principais');
    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>(
        'all',
    );
    const [source, setSource] = useState<'all' | string>('all');
    const [sort, setSort] = useState<'recent' | 'most-read' | 'trending'>(
        'recent',
    );
    const [savedNews, setSavedNews] = useState<string[]>([
        'news-1',
        'news-3',
        'news-8',
    ]);
    const [readNews, setReadNews] = useState<string[]>(['news-2', 'news-6']);
    const [myNewsTab, setMyNewsTab] = useState<MyNewsTab>('Salvas');
    const [visibleItems, setVisibleItems] = useState(7);
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const sources = useMemo(() => getNewsSources(), []);

    const filteredNews = useMemo(
        () =>
            filterNews({
                tab: activeTab,
                query,
                period,
                source,
                sort,
            }),
        [activeTab, period, query, sort, source],
    );

    useEffect(() => {
        setIsLoading(true);
        setVisibleItems(7);
        const timer = setTimeout(() => setIsLoading(false), 450);
        return () => clearTimeout(timer);
    }, [activeTab, period, query, sort, source]);

    const heroNews = filteredNews[0] as NewsItem | undefined;
    const feedNews = filteredNews.slice(1, visibleItems);
    const nonReadCount = filteredNews.filter(
        news => !readNews.includes(news.id),
    ).length;
    const sidebarMostRead = useMemo(
        () => [...filteredNews].sort((a, b) => b.views - a.views).slice(0, 6),
        [filteredNews],
    );
    const hasMoreItems = visibleItems < filteredNews.length;

    const loadMore = useCallback(() => {
        setVisibleItems(value => value + 6);
    }, []);

    const toggleSaved = useCallback((newsId: string) => {
        setSavedNews(current =>
            current.includes(newsId)
                ? current.filter(item => item !== newsId)
                : [...current, newsId],
        );
    }, []);

    const markAsRead = useCallback((newsId: string) => {
        setReadNews(current =>
            current.includes(newsId) ? current : [...current, newsId],
        );
    }, []);

    const isRead = useCallback(
        (newsId: string) => readNews.includes(newsId),
        [readNews],
    );

    const toggleMobileFilters = useCallback(() => {
        setShowMobileFilters(value => !value);
    }, []);

    return {
        tabs,
        myNewsTabs,
        activeTab,
        setActiveTab,
        query,
        setQuery,
        period,
        setPeriod,
        source,
        setSource,
        sort,
        setSort,
        sources,
        isLoading,
        showMobileFilters,
        toggleMobileFilters,
        heroNews,
        feedNews,
        nonReadCount,
        sidebarMostRead,
        hasMoreItems,
        loadMore,
        toggleSaved,
        markAsRead,
        isRead,
        savedNews,
        readNews,
        myNewsTab,
        setMyNewsTab,
    };
};

export default useNews;
