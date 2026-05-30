import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Tabs } from '@ui/Tabs';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';

import { useTitle } from '@features/manga';
import { useChapters } from '@features/chapter';
import { useRatings } from '@features/rating';
import { getGroupsByTitleId } from '@features/group';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import TitleHero from './parts/TitleHero';
import ChaptersTab from './parts/ChaptersTab';
import ReviewsTab from './parts/ReviewsTab';
import GroupsTab from './parts/GroupsTab';
import AboutTab from './parts/AboutTab';

const TitleDetails = () => {
    const { titleId } = useParams();
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');

    const [tab, setTab] = useState('chapters');
    const [lang, setLang] = useState('all');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [chSearch, setChSearch] = useState('');
    const [chPage, setChPage] = useState(0);

    const { title, isLoading, isError } = useTitle(titleId ?? '');
    const { chapters, totalPages, isLoading: chaptersLoading } = useChapters(titleId ?? '', { page: chPage, direction: order });
    const { ratings, average } = useRatings(titleId ?? '');
    const { data: groupsPage } = useQuery({
        queryKey: [QUERY_KEYS.GROUPS_BY_TITLE, titleId],
        queryFn: () => getGroupsByTitleId(titleId!, 0, 10),
        enabled: Boolean(titleId),
    });
    const groups = groupsPage?.content ?? [];

    const tabItems = [
        { value: 'chapters', label: t('titleDetails.tabs.chapters') },
        { value: 'reviews', label: t('titleDetails.tabs.reviews') },
        { value: 'groups', label: t('titleDetails.tabs.groups') },
        { value: 'about', label: t('titleDetails.tabs.about') },
    ];

    if (isLoading) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <div className="animate-pulse space-y-6">
                    <div className="flex gap-8">
                        <div className="h-[220px] w-[156px] shrink-0 rounded-mr-md bg-mr-tertiary/20" />
                        <div className="flex-1 space-y-3 py-2">
                            <div className="h-8 w-2/3 rounded bg-mr-tertiary/20" />
                            <div className="h-4 w-1/3 rounded bg-mr-tertiary/20" />
                        </div>
                    </div>
                </div>
            </PageContainer>
        );
    }

    if (isError || !title) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <EmptyState
                    illustration="404"
                    title={t('titleDetails.notFound')}
                    action={
                        <Button variant="primary" onClick={() => navigate('/genres')}>
                            {t('titleDetails.backToCatalog')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer asMain size="default" paddingY="md">
            <TitleHero title={title} average={average} groupCount={groups.length} />

            <div className="mb-6 sticky top-0 z-10 bg-mr-primary pt-1 pb-1">
                <Tabs items={tabItems} value={tab} onChange={setTab} variant="underline" />
            </div>

            {tab === 'chapters' && (
                <ChaptersTab
                    titleId={titleId ?? ''}
                    chapters={chapters}
                    totalPages={totalPages}
                    isLoading={chaptersLoading}
                    lang={lang}
                    onLangChange={setLang}
                    order={order}
                    onOrderChange={setOrder}
                    search={chSearch}
                    onSearchChange={setChSearch}
                    page={chPage}
                    onPageChange={setChPage}
                />
            )}
            {tab === 'reviews' && <ReviewsTab ratings={ratings} average={average} />}
            {tab === 'groups' && <GroupsTab groups={groups} />}
            {tab === 'about' && <AboutTab title={title} />}
        </PageContainer>
    );
};

export default TitleDetails;
