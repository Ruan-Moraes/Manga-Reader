import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { useAuth } from '@features/auth';
import { useFilterResults } from '@entities/catalog-filter';
import { useSavedMangas } from '@features/library';
import { getForumTopics } from '@entities/forum';
import { getGroups } from '@entities/group';

import { PageContainer } from '@ui/PageContainer';

import { useTranslation } from 'react-i18next';

import HomeHero from './parts/HomeHero';
import HomeContinueReading from './parts/HomeContinueReading';
import HomeTrending from './parts/HomeTrending';
import HomeNewReleases from './parts/HomeNewReleases';
import HomeCommunity from './parts/HomeCommunity';
import HomeGroups from './parts/HomeGroups';
import HomeForYou from './parts/HomeForYou';

const THIRTY_MIN = 1000 * 60 * 30;
const FILTER_BASE = {
    genres: [],
    status: 'all' as const,
    adultContent: 'no_adult_content' as const,
    page: 0,
};

const Home = () => {
    const { t } = useTranslation('home');
    const { isLoggedIn } = useAuth();

    const { data: trendingData } = useFilterResults({
        ...FILTER_BASE,
        sort: 'most_read',
        size: 7,
    });
    const { data: releasesData } = useFilterResults({
        ...FILTER_BASE,
        sort: 'most_recent',
        size: 5,
    });
    const { data: forYouData } = useFilterResults({
        ...FILTER_BASE,
        sort: 'random',
        size: 5,
    });

    const trending = trendingData?.content ?? [];
    const featuredTitles = trending.slice(0, 2);
    const trendingList = trending.slice(1, 6);
    const releases = releasesData?.content ?? [];
    const forYou = forYouData?.content ?? [];

    const { data: topicsPage } = useQuery({
        queryKey: [QUERY_KEYS.FORUM_TOPICS, 'home', 0, 5],
        queryFn: () => getForumTopics(0, 5, {}),
        staleTime: THIRTY_MIN,
    });
    const topics = (topicsPage?.content ?? []).slice(0, 3);

    const { data: groupsPage } = useQuery({
        queryKey: [QUERY_KEYS.GROUPS, 'home', 0, 5],
        queryFn: () => getGroups(0, 5),
        staleTime: THIRTY_MIN,
    });
    const groups = (groupsPage?.content ?? []).slice(0, 3);

    const { items: continueItems, loading: continueLoading } = useSavedMangas('Lendo');
    const continueReading = continueItems.slice(0, 5);

    return (
        <PageContainer asMain paddingY="md">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-mr-accent focus:px-3 focus:py-1 focus:text-mr-primary"
            >
                {t('skipToContent')}
            </a>
            <div id="main-content" className="flex flex-col gap-12">
                <HomeHero featuredTitles={featuredTitles} />

                {isLoggedIn && (continueLoading || continueReading.length > 0) && (
                    <HomeContinueReading continueLoading={continueLoading} continueReading={continueReading} />
                )}

                <HomeTrending trendingList={trendingList} />

                <HomeNewReleases releases={releases} />

                <HomeCommunity topics={topics} />

                <HomeGroups groups={groups} />

                {isLoggedIn && forYou.length > 0 && <HomeForYou forYou={forYou} />}
            </div>
        </PageContainer>
    );
};

export default Home;
