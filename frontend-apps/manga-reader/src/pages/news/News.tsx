import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Tabs } from '@ui/Tabs';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import { useNews, type NewsTabId } from '@features/news';

import { NewsHero } from './parts/NewsHero';
import { NewsFeed } from './parts/NewsFeed';

const News = () => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('news');
    const { activeTab, setActiveTab, isLoading, heroNews, feedNews, hasMoreItems, loadMore } = useNews();

    const isEmpty = !isLoading && !heroNews && feedNews.length === 0;

    const TAB_ITEMS = [
        { value: 'featured', label: t('page.tabs.featured') },
        { value: 'releases', label: t('page.tabs.releases') },
        { value: 'adaptations', label: t('page.tabs.adaptations') },
        { value: 'industry', label: t('page.tabs.industry') },
        { value: 'events', label: t('page.tabs.events') },
        { value: 'curiosities', label: t('page.tabs.curiosities') },
    ];

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader eyebrow={t('page.eyebrow')} title={t('page.weekTitle')} className="mb-6" />

            <Tabs items={TAB_ITEMS} value={activeTab} onChange={v => setActiveTab(v as NewsTabId)} variant="pills" size="sm" />

            {isLoading ? (
                <div className="mt-6 flex flex-col gap-3">
                    <Skeleton variant="rect" height={180} className="rounded-mr-md" />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} variant="rect" height={180} className="rounded-mr-md" />
                        ))}
                    </div>
                </div>
            ) : isEmpty ? (
                <div className="mt-8">
                    <EmptyState illustration="duvida" title={t('page.emptyTitle')} description={t('page.emptyDescription')} />
                </div>
            ) : (
                <div className="mt-6 flex flex-col gap-6">
                    {heroNews && <NewsHero news={heroNews} onClick={() => navigate(`/news/${heroNews.id}`)} />}
                    <NewsFeed items={feedNews} hasMore={hasMoreItems} onItemClick={id => navigate(`/news/${id}`)} onLoadMore={loadMore} />
                </div>
            )}
        </PageContainer>
    );
};

export default News;
