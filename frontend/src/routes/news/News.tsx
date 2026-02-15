import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiBookOpen,
    FiBookmark,
    FiClock,
    FiFilter,
    FiBell,
    FiSearch,
    FiShare2,
    FiTrendingUp,
} from 'react-icons/fi';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';
import {
    NewsCategory,
    filterNews,
    formatRelativeDate,
    getNewsSources,
    isNewsFresh,
} from '../../services/mock/mockNewsService';

const tabs: Array<'all' | 'Principais' | NewsCategory> = [
    'Principais',
    'Lançamentos',
    'Adaptações',
    'Indústria',
    'Eventos',
    'Curiosidades',
];

const myNewsTabs = ['Salvas', 'Lidas', 'Recomendadas'] as const;

const News = () => {
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
    const [myNewsTab, setMyNewsTab] =
        useState<(typeof myNewsTabs)[number]>('Salvas');
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

    const heroNews = filteredNews[0];
    const feedNews = filteredNews.slice(1, visibleItems);
    const nonReadCount = filteredNews.filter(
        news => !readNews.includes(news.id),
    ).length;
    const sidebarMostRead = [...filteredNews]
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);

    const mobileFilterPanel = (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                    value={period}
                    onChange={event =>
                        setPeriod(event.target.value as typeof period)
                    }
                    className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
                >
                    <option value="all">Todo período</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última semana</option>
                    <option value="month">Último mês</option>
                </select>

                <select
                    value={source}
                    onChange={event => setSource(event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
                >
                    <option value="all">Todas as fontes</option>
                    {sources
                        .filter(item => item !== 'all')
                        .map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                </select>

                <select
                    value={sort}
                    onChange={event =>
                        setSort(event.target.value as typeof sort)
                    }
                    className="w-full px-3 py-2 border rounded-lg border-tertiary bg-secondary"
                >
                    <option value="recent">Mais recentes</option>
                    <option value="most-read">Mais lidas</option>
                    <option value="trending">Trending</option>
                </select>
            </div>
        </div>
    );

    return (
        <>
            <Header />
            <Main>
                <section className="p-4 border rounded-2xl border-tertiary bg-secondary">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-2 text-3xl font-bold">
                                <FiBell className="text-purple-400" /> Notícias
                            </h1>
                            <p className="mt-2 text-sm text-tertiary">
                                Fique por dentro das últimas novidades do mundo
                                dos mangás, animes, lançamentos e adaptações.
                            </p>
                        </div>
                        <span className="px-3 py-2 text-sm font-medium text-purple-200 border rounded-full bg-purple-600/20 border-purple-500/40">
                            {nonReadCount} não lidas
                        </span>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                                    activeTab === tab
                                        ? 'bg-purple-600 text-white'
                                        : 'border border-tertiary bg-secondary text-primary'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                        <label className="relative">
                            <FiSearch className="absolute -translate-y-1/2 left-3 top-1/2 text-tertiary" />
                            <input
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                placeholder="Buscar por título, conteúdo, obra ou autor"
                                className="w-full py-2 pl-10 pr-3 border rounded-lg border-tertiary bg-secondary"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() =>
                                setShowMobileFilters(value => !value)
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg lg:hidden border-tertiary"
                        >
                            <FiFilter /> Filtros
                        </button>
                        <div className="hidden lg:block lg:col-span-2">
                            {mobileFilterPanel}
                        </div>
                    </div>

                    {showMobileFilters && (
                        <div className="p-3 border rounded-xl border-tertiary bg-secondary lg:hidden">
                            {mobileFilterPanel}
                        </div>
                    )}
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                        {isLoading && (
                            <div className="w-full h-64 animate-pulse rounded-2xl bg-primary" />
                        )}

                        {!isLoading && heroNews && (
                            <Link
                                to={`/news/${heroNews.id}`}
                                className="block overflow-hidden transition border rounded-2xl border-tertiary bg-secondary hover:-translate-y-1"
                            >
                                <div className="relative">
                                    <img
                                        src={heroNews.coverImage}
                                        alt={heroNews.title}
                                        className="object-cover w-full aspect-video"
                                    />
                                    <span className="absolute px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full left-4 top-4">
                                        {heroNews.isExclusive
                                            ? 'Exclusivo'
                                            : 'Destaque'}
                                    </span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="text-xs text-purple-300">
                                        {heroNews.category}
                                    </p>
                                    <h2 className="text-2xl font-bold line-clamp-3">
                                        {heroNews.title}
                                    </h2>
                                    <p className="text-sm text-tertiary line-clamp-3">
                                        {heroNews.excerpt}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-tertiary">
                                        <span>{heroNews.author.name}</span>
                                        <span>
                                            {formatRelativeDate(
                                                heroNews.publishedAt,
                                            )}
                                        </span>
                                        <span>{heroNews.readTime} min</span>
                                        <span>
                                            {heroNews.views.toLocaleString(
                                                'pt-BR',
                                            )}{' '}
                                            views
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        )}

                        <div className="grid gap-3 md:grid-cols-2">
                            {!isLoading &&
                                feedNews.map(news => (
                                    <article
                                        key={news.id}
                                        className={`rounded-xl border border-tertiary bg-secondary p-3 transition hover:-translate-y-1 ${
                                            readNews.includes(news.id)
                                                ? 'opacity-80'
                                                : ''
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
                                                onClick={() =>
                                                    setSavedNews(current =>
                                                        current.includes(
                                                            news.id,
                                                        )
                                                            ? current.filter(
                                                                  item =>
                                                                      item !==
                                                                      news.id,
                                                              )
                                                            : [
                                                                  ...current,
                                                                  news.id,
                                                              ],
                                                    )
                                                }
                                                className="absolute p-2 text-white transition rounded-full top-2 right-2 bg-black/40 hover:bg-black/60"
                                            >
                                                <FiBookmark />
                                            </button>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            <h3 className="font-semibold leading-snug line-clamp-2">
                                                <Link
                                                    to={`/news/${news.id}`}
                                                    onClick={() =>
                                                        setReadNews(current =>
                                                            current.includes(
                                                                news.id,
                                                            )
                                                                ? current
                                                                : [
                                                                      ...current,
                                                                      news.id,
                                                                  ],
                                                        )
                                                    }
                                                >
                                                    {news.title}
                                                </Link>
                                            </h3>
                                            <p className="text-sm text-tertiary line-clamp-1">
                                                {news.excerpt}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-tertiary">
                                                <span className="inline-flex items-center gap-1">
                                                    <FiBookOpen /> {news.source}
                                                </span>
                                                <span>
                                                    {formatRelativeDate(
                                                        news.publishedAt,
                                                    )}
                                                </span>
                                                <span>{news.readTime} min</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="px-2 py-1 text-xs rounded-full bg-primary">
                                                    {news.category}
                                                </span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {isNewsFresh(
                                                        news.publishedAt,
                                                    ) && (
                                                        <span className="px-2 py-1 text-green-300 rounded-full bg-green-800/30">
                                                            Nova
                                                        </span>
                                                    )}
                                                    {news.trendingScore >
                                                        88 && (
                                                        <span className="inline-flex items-center gap-1 text-orange-300">
                                                            <FiTrendingUp />{' '}
                                                            Trending
                                                        </span>
                                                    )}
                                                    <FiShare2 className="text-tertiary" />
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                        </div>

                        {visibleItems < filteredNews.length && (
                            <button
                                type="button"
                                onClick={() =>
                                    setVisibleItems(value => value + 6)
                                }
                                className="w-full py-2 font-medium border rounded-lg border-tertiary bg-secondary"
                            >
                                Carregar mais notícias
                            </button>
                        )}
                    </div>

                    <aside className="space-y-4">
                        <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                            <h3 className="font-semibold">Mais lidas</h3>
                            {sidebarMostRead.map(item => (
                                <Link
                                    key={item.id}
                                    to={`/news/${item.id}`}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="w-2 h-2 mt-2 bg-purple-400 rounded-full" />
                                    <div>
                                        <p className="line-clamp-2">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-tertiary">
                                            {formatRelativeDate(
                                                item.publishedAt,
                                            )}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                            <h3 className="font-semibold">Minhas Notícias</h3>
                            <div className="flex flex-wrap gap-2">
                                {myNewsTabs.map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setMyNewsTab(tab)}
                                        className={`rounded-full px-3 py-1 text-xs ${
                                            myNewsTab === tab
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-primary'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            {myNewsTab === 'Salvas' && (
                                <p className="text-sm text-tertiary">
                                    {savedNews.length} notícias salvas para ler
                                    depois.
                                </p>
                            )}
                            {myNewsTab === 'Lidas' && (
                                <p className="text-sm text-tertiary">
                                    {readNews.length} notícias lidas no
                                    histórico recente.
                                </p>
                            )}
                            {myNewsTab === 'Recomendadas' && (
                                <p className="text-sm text-tertiary">
                                    Recomendações baseadas em {readNews.length}{' '}
                                    leituras e categorias favoritas.
                                </p>
                            )}
                        </div>

                        <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                            <h3 className="font-semibold">
                                Alertas e notificações
                            </h3>
                            <p className="text-sm text-tertiary">
                                Receba notificações de novas notícias das
                                categorias preferidas e autores seguidos.
                            </p>
                            <div className="text-xs text-tertiary">
                                <p className="inline-flex items-center gap-1">
                                    <FiClock /> Última atualização: agora
                                </p>
                            </div>
                        </div>
                    </aside>
                </section>
            </Main>
            <Footer />
        </>
    );
};

export default News;
