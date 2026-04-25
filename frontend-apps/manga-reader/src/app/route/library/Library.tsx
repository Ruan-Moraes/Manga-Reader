import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import { useSavedMangas } from '@feature/library';
import LibraryTabs from '@feature/library/component/LibraryTabs';
import LibraryCard from '@feature/library/component/LibraryCard';
import LibraryEmptyState from '@feature/library/component/LibraryEmptyState';
import LibrarySkeleton from '@feature/library/component/LibrarySkeleton';

const Library = () => {
    const { t } = useTranslation('library');
    const {
        items,
        counts,
        activeTab,
        loading,
        error,
        hasMore,
        changeTab,
        loadMore,
        changeList,
        removeFromSaved,
        retry,
    } = useSavedMangas();

    return (
        <>
            <Header />
            <MainContent>
                <section className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">{t('page.title')}</h2>
                    <p className="text-sm text-tertiary">
                        {t('page.subtitle')}
                    </p>
                </section>

                <LibraryTabs
                    activeTab={activeTab}
                    counts={counts}
                    onChange={changeTab}
                />

                {error && (
                    <div className="flex items-center gap-3 p-3 text-sm border rounded-xs border-quinary-default bg-quinary-default/10">
                        <span>{error}</span>
                        <button
                            onClick={retry}
                            className="px-3 py-1 text-xs border rounded-xs border-quinary-default hover:bg-quinary-default/20"
                        >
                            {t('page.retry')}
                        </button>
                    </div>
                )}

                {loading ? (
                    <LibrarySkeleton />
                ) : items.length === 0 && !error ? (
                    <LibraryEmptyState tab={activeTab} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {items.map(manga => (
                                <LibraryCard
                                    key={manga.titleId}
                                    manga={manga}
                                    onChangeList={changeList}
                                    onRemove={removeFromSaved}
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center">
                                <button
                                    onClick={loadMore}
                                    className="px-4 py-2 text-sm border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                                >
                                    {t('page.loadMore')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </MainContent>
            <Footer />
        </>
    );
};

export default Library;
