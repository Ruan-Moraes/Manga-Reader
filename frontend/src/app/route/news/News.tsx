import { Link } from 'react-router-dom';
import { FiClock, FiFilter, FiBell, FiSearch } from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import {
    useNews,
    NewsCard,
    HeroNews,
    NewsFilterPanel,
    formatRelativeDate,
} from '@feature/news';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const News = () => {
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
                            onClick={toggleMobileFilters}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-lg lg:hidden border-tertiary"
                        >
                            <FiFilter /> Filtros
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
            </MainContent>
            <Footer />
        </>
    );
};

export default News;
