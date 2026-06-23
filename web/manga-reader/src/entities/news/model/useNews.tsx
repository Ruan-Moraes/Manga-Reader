import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getNews, filterNews } from '../api/newsService';
import type { NewsItem, NewsTabId } from '../model/news.types';

const tabs = [
    { id: 'featured' as const, labelKey: 'page.tabs.featured' },
    { id: 'releases' as const, labelKey: 'page.tabs.releases' },
    { id: 'adaptations' as const, labelKey: 'page.tabs.adaptations' },
    { id: 'industry' as const, labelKey: 'page.tabs.industry' },
    { id: 'events' as const, labelKey: 'page.tabs.events' },
    { id: 'curiosities' as const, labelKey: 'page.tabs.curiosities' },
] as const;

const myNewsTabs = [
    { id: 'saved' as const, labelKey: 'page.tabs.saved' },
    { id: 'read' as const, labelKey: 'page.tabs.read' },
    { id: 'recommended' as const, labelKey: 'page.tabs.recommended' },
] as const;

type MyNewsTabId = (typeof myNewsTabs)[number]['id'];

const THIRTY_MINUTES = 1000 * 60 * 30;
const NEWS_PAGE_SIZE = 100;
const FILTER_SHIMMER_MS = 450;

const useNews = () => {
    const [activeTab, setActiveTab] = useState<NewsTabId>('featured');
    const [query, setQuery] = useState('');
    const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [source, setSource] = useState<'all' | string>('all');
    const [sort, setSort] = useState<'recent' | 'most-read' | 'trending'>('recent');
    const [savedNews, setSavedNews] = useState<string[]>([]);
    const [readNews, setReadNews] = useState<string[]>([]);
    const [myNewsTab, setMyNewsTab] = useState<MyNewsTabId>('saved');
    const [visibleItems, setVisibleItems] = useState(7);
    const [filterTransition, setFilterTransition] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const { data, isLoading: isFetching } = useQuery({
        queryKey: [QUERY_KEYS.NEWS, 0, NEWS_PAGE_SIZE],
        queryFn: () => getNews(0, NEWS_PAGE_SIZE),
        staleTime: THIRTY_MINUTES,
    });

    const allNews = useMemo<NewsItem[]>(() => data?.content ?? [], [data]);
    const isLoading = isFetching || filterTransition;

    const sources = useMemo(() => {
        const unique = Array.from(new Set(allNews.map(n => n.source)));
        return ['all', ...unique] as readonly string[];
    }, [allNews]);

    const filteredNews = useMemo(
        () =>
            filterNews(allNews, {
                tab: activeTab,
                query,
                period,
                source,
                sort,
            }),
        [allNews, activeTab, period, query, sort, source],
    );

    useEffect(() => {
        setFilterTransition(true);
        setVisibleItems(7);
        const timer = setTimeout(() => setFilterTransition(false), FILTER_SHIMMER_MS);
        return () => clearTimeout(timer);
    }, [activeTab, period, query, sort, source]);

    const heroNews = filteredNews[0] as NewsItem | undefined;
    const feedNews = filteredNews.slice(1, visibleItems);
    const nonReadCount = filteredNews.filter(news => !readNews.includes(news.id)).length;
    const sidebarMostRead = useMemo(() => [...filteredNews].sort((a, b) => b.views - a.views).slice(0, 6), [filteredNews]);
    const hasMoreItems = visibleItems < filteredNews.length;

    const loadMore = useCallback(() => {
        setVisibleItems(value => value + 6);
    }, []);

    const toggleSaved = useCallback((newsId: string) => {
        setSavedNews(current => (current.includes(newsId) ? current.filter(item => item !== newsId) : [...current, newsId]));
    }, []);

    const markAsRead = useCallback((newsId: string) => {
        setReadNews(current => (current.includes(newsId) ? current : [...current, newsId]));
    }, []);

    const isRead = useCallback((newsId: string) => readNews.includes(newsId), [readNews]);

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
