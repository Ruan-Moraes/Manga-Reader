import { ROUTES } from '@shared/constant/ROUTES';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Home, Search } from 'lucide-react';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Tabs } from '@ui/Tabs';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';

import { useTitle, useTitleModals } from '@entities/manga';
import { useChapters } from '@entities/chapter';
import { useRatingSummary, useSubmitReview, RatingModal } from '@entities/review';
import { getGroupsByTitleId } from '@entities/group';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { useAuth } from '@features/auth';

import TitleHero from './parts/TitleHero';
import ChaptersTab from './parts/ChaptersTab';
import ReviewsTab from './parts/ReviewsTab';
import CommentsTab from './parts/CommentsTab';
import GroupsTab from './parts/GroupsTab';
import StoresTab from './parts/StoresTab';
import TitleAboutTab from './parts/TitleAboutTab';
import TitleDetailsSkeleton from './parts/TitleDetailsSkeleton';

const TitleDetails = () => {
    const { t } = useTranslation('manga');

    const { titleId } = useParams();
    const navigate = useAppNavigate();

    const [tab, setTab] = useState('chapters');
    const [lang, setLang] = useState('all');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [chSearch, setChSearch] = useState('');
    const [chPage, setChPage] = useState(0);

    const { title, isLoading, isError } = useTitle(titleId ?? '');
    const { chapters, totalPages, isLoading: chaptersLoading } = useChapters(titleId ?? '', { page: chPage, direction: order });
    const { average, distribution } = useRatingSummary(titleId ?? '');
    const submitReview = useSubmitReview(titleId ?? '');
    const { isRatingModalOpen, openRatingModal, closeRatingModal } = useTitleModals();
    const { isLoggedIn } = useAuth();

    const { data: groupsPage } = useQuery({
        queryKey: [QUERY_KEYS.GROUPS_BY_TITLE, titleId],
        queryFn: () => getGroupsByTitleId(titleId!, 0, 10),
        enabled: Boolean(titleId),
    });

    const groups = groupsPage?.content ?? [];

    const tabItems = [
        { value: 'chapters', label: t('titleDetails.tabs.chapters') },
        { value: 'reviews', label: t('titleDetails.tabs.reviews') },
        { value: 'comments', label: t('titleDetails.tabs.comments') },
        { value: 'groups', label: t('titleDetails.tabs.groups') },
        { value: 'stores', label: t('titleDetails.tabs.stores') },
        { value: 'about', label: t('titleDetails.tabs.about') },
    ];

    if (isLoading) {
        return <TitleDetailsSkeleton />;
    }

    if (isError || !title) {
        return (
            <PageContainer asMain paddingY="lg" className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                    illustration="404"
                    title={t('titleDetails.notFound')}
                    description={t('titleDetails.notFoundDesc')}
                    action={
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button variant="primary" icon={Home} onClick={() => navigate(ROUTES.HOME)}>
                                {t('titleDetails.goHome')}
                            </Button>
                            <Button variant="ghost" icon={Search} onClick={() => navigate(ROUTES.CATALOG)}>
                                {t('titleDetails.browseCatalog')}
                            </Button>
                        </div>
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

            {tab === 'reviews' && (
                <ReviewsTab titleId={titleId ?? ''} average={average} distribution={distribution} onWriteReview={openRatingModal} isLoggedIn={isLoggedIn} />
            )}
            {tab === 'comments' && <CommentsTab titleId={titleId ?? ''} />}
            {tab === 'groups' && <GroupsTab groups={groups} />}
            {tab === 'stores' && <StoresTab titleId={titleId ?? ''} />}
            {tab === 'about' && <TitleAboutTab title={title} />}

            <RatingModal
                isModalOpen={isRatingModalOpen}
                closeModal={closeRatingModal}
                onSubmitRating={data => submitReview.mutate(data)}
                isSubmitting={submitReview.isPending}
                titleName={title.name}
            />
        </PageContainer>
    );
};

export default TitleDetails;
