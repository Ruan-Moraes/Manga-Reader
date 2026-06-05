import { useTranslation } from 'react-i18next';
import { Plus, Users } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { StatusDot } from '@ui/StatusDot';
import { Button } from '@ui/Button';

import { useForumPage } from '@entities/forum';

import { ForumFilters } from './parts/ForumFilters';
import { ForumTopicList } from './parts/ForumTopicList';

const Forum = () => {
    const navigate = useAppNavigate();

    const { t } = useTranslation('forum');

    const { activeCategory, sort, query, page, setPage, allTopics, topics, totalPages, updateCategory, updateSort, updateQuery } = useForumPage();

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader
                eyebrow={t('page.eyebrow')}
                title={t('page.title')}
                meta={t('page.topicsCount', { count: allTopics.length })}
                action={
                    <Button variant="primary" icon={Plus}>
                        {t('page.newTopic')}
                    </Button>
                }
                className="mb-4"
            />

            <div className="mb-6 inline-flex items-center gap-2 rounded-mr-full border border-mr-border bg-mr-surface px-4 py-2 text-mr-tiny text-mr-fg-muted">
                <StatusDot status="operating" size={8} />
                <Users className="size-3" />
                <span>
                    <strong className="text-mr-fg">3.241</strong> {t('page.liveReaders')}
                </span>
            </div>

            <ForumFilters query={query} sort={sort} activeCategory={activeCategory} onQuery={updateQuery} onSort={updateSort} onCategory={updateCategory} />

            <ForumTopicList
                topics={topics}
                allTopicsCount={allTopics.length}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                onTopicClick={id => navigate(ROUTES.FORUM_TOPIC(id))}
            />
        </PageContainer>
    );
};

export default Forum;
