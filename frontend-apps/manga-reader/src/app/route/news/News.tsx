import { Link } from 'react-router-dom';
import { FiClock, FiFilter, FiBell } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import SearchInput from '@shared/component/input/SearchInput';

import {
    useNews,
    NewsCard,
    HeroNews,
    NewsFilterPanel,
    formatRelativeDate,
} from '@feature/news';

const News = () => {
    const { t } = useTranslation('news');
    const {
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
    } = useNews();

    return (
        <>
            <Header />
            <MainContent>
                <section className="p-4 border rounded-2xl border-tertiary bg-secondary">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-2 text-3xl font-bold">
                                <FiBell className="text-purple-400" />{' '}
                                {t('page.title')}
                            </h1>
                            <p className="mt-2 text-sm text-tertiary">
                                {t('page.subtitle')}
                            </p>
                        </div>
                        <span className="px-3 py-2 text-sm font-medium text-purple-200 border rounded-full bg-purple-600/20 border-purple-500/40">
                            {t('page.unread', { count: nonReadCount })}
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
                                {t(`tabs.${tab}`, { defaultValue: tab })}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder={t('page.searchPlaceholder')}
                        />
                        <button
                            type="button"
                            onClick={toggleMobileFilters}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg lg:hidden border-tertiary"
                        >
                            <FiFilter /> {t('page.filters')}
                        </button>
                        <div className="hidden lg:block lg:col-span-2">
                            <NewsFilterPanel
                                period={period}
                                setPeriod={setPeriod}
                                source={source}
                                setSource={setSource}
                                sort={sort}
                                setSort={setSort}
                                sources={sources}
                            />
                        </div>
                    </div>

                    {showMobileFilters && (
                        <div className="p-3 border rounded-xl border-tertiary bg-secondary lg:hidden">
                            <NewsFilterPanel
                                period={period}
                                setPeriod={setPeriod}
                                source={source}
                                setSource={setSource}
                                sort={sort}
                                setSort={setSort}
                                sources={sources}
                            />
                        </div>
                    )}
                </section>

                <section className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-2">
                        {isLoading && (
                            <div className="w-full h-64 animate-pulse rounded-2xl bg-primary" />
                        )}

                        {!isLoading && heroNews && <HeroNews news={heroNews} />}

                        <div className="grid gap-3 md:grid-cols-2">
                            {!isLoading &&
                                feedNews.map(news => (
                                    <NewsCard
                                        key={news.id}
                                        news={news}
                                        isRead={isRead(news.id)}
                                        onToggleSave={toggleSaved}
                                        onMarkRead={markAsRead}
                                    />
                                ))}
                        </div>

                        {hasMoreItems && (
                            <button
                                type="button"
                                onClick={loadMore}
                                className="w-full py-2 font-medium border rounded-lg border-tertiary bg-secondary"
                            >
                                {t('page.loadMore')}
                            </button>
                        )}
                    </div>

                    <aside className="space-y-4">
                        <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                            <h3 className="font-semibold">
                                {t('page.sidebar.mostRead')}
                            </h3>
                            {sidebarMostRead.map(item => (
                                <Link
                                    key={item.id}
                                    to={`/Manga-Reader/news/${item.id}`}
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
                            <h3 className="font-semibold">
                                {t('page.sidebar.myNews')}
                            </h3>
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
                                        {t(`myNewsTabs.${tab}`, {
                                            defaultValue: tab,
                                        })}
                                    </button>
                                ))}
                            </div>
                            {myNewsTab === 'Salvas' && (
                                <p className="text-sm text-tertiary">
                                    {t('page.sidebar.savedDescription', {
                                        count: savedNews.length,
                                    })}
                                </p>
                            )}
                            {myNewsTab === 'Lidas' && (
                                <p className="text-sm text-tertiary">
                                    {t('page.sidebar.readDescription', {
                                        count: readNews.length,
                                    })}
                                </p>
                            )}
                            {myNewsTab === 'Recomendadas' && (
                                <p className="text-sm text-tertiary">
                                    {t('page.sidebar.recommendedDescription', {
                                        count: readNews.length,
                                    })}
                                </p>
                            )}
                        </div>

                        <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                            <h3 className="font-semibold">
                                {t('page.sidebar.alertsTitle')}
                            </h3>
                            <p className="text-sm text-tertiary">
                                {t('page.sidebar.alertsDescription')}
                            </p>
                            <div className="text-xs text-tertiary">
                                <p className="inline-flex items-center gap-1">
                                    <FiClock /> {t('page.sidebar.lastUpdate')}
                                </p>
                            </div>
                        </div>
                    </aside>
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default News;
