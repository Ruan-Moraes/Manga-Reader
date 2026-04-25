import { useMemo } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import BaseSelect from '@shared/component/input/BaseSelect';
import SearchInput from '@shared/component/input/SearchInput';

import {
    useForumPage,
    TopicCard,
    Pagination,
    ForumStats,
    forumCategories,
    forumSortOptions,
    type ForumSort,
} from '@feature/forum';

const Forum = () => {
    const { t } = useTranslation('forum');
    const {
        activeCategory,
        sort,
        query,
        page,
        setPage,
        allTopics,
        topics,
        totalPages,
        updateCategory,
        updateSort,
        updateQuery,
    } = useForumPage();

    const translatedSortOptions = useMemo(
        () =>
            forumSortOptions.map(option => ({
                value: option.value,
                label: t(`sort.${option.value}`, { defaultValue: option.label }),
            })),
        [t],
    );

    return (
        <>
            <Header />
            <MainContent>
                <section className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <FiMessageSquare
                            className="text-quaternary-default"
                            size={28}
                        />
                        <h1 className="text-2xl font-bold">
                            {t('page.title')}
                        </h1>
                    </div>
                    <p className="max-w-xl mx-auto text-sm text-shadow-secondary">
                        {t('page.subtitle')}
                    </p>
                </section>
                <ForumStats topics={allTopics} />
                <section className="flex flex-col gap-3">
                    <SearchInput
                        value={query}
                        onChange={updateQuery}
                        placeholder={t('page.searchPlaceholder')}
                    />
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => updateCategory('all')}
                            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                activeCategory === 'all'
                                    ? 'bg-quaternary-default text-primary-default font-bold'
                                    : 'bg-secondary border border-tertiary hover:bg-tertiary'
                            }`}
                        >
                            {t('page.allCategories')}
                        </button>
                        {forumCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => updateCategory(cat)}
                                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                                    activeCategory === cat
                                        ? 'bg-quaternary-default text-primary-default font-bold'
                                        : 'bg-secondary border border-tertiary hover:bg-tertiary'
                                }`}
                            >
                                {t(`categories.${cat}`, { defaultValue: cat })}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-shadow-secondary">
                            {t('page.sortLabel')}
                        </span>
                        <BaseSelect
                            options={translatedSortOptions}
                            value={sort}
                            onChange={e =>
                                updateSort(e.target.value as ForumSort)
                            }
                            className="px-3 py-1.5 text-xs border rounded-xs bg-secondary border-tertiary"
                        />

                        <span className="ml-auto text-xs text-shadow-secondary">
                            {t('page.foundTopics', { count: allTopics.length })}
                        </span>
                    </div>
                </section>
                <section className="flex flex-col gap-3">
                    {topics.length === 0 ? (
                        <div className="py-12 text-center">
                            <FiMessageSquare
                                className="mx-auto mb-3 text-shadow-secondary"
                                size={40}
                            />
                            <p className="text-sm text-shadow-secondary">
                                {t('page.emptyState')}
                            </p>
                        </div>
                    ) : (
                        topics.map(topic => (
                            <TopicCard key={topic.id} topic={topic} />
                        ))
                    )}
                </section>
                <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </MainContent>
            <Footer />
        </>
    );
};

export default Forum;
