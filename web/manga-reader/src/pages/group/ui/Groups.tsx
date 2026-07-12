import { useTranslation } from 'react-i18next';
import { ArrowDownAZ, Layers, Search, Users } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { PageContainer } from '@ui/PageContainer';
import { useGroups } from '@entities/group';

import { useGroupFilters, type GroupSortBy } from '../model/useGroupFilters';
import { CatSortSelect, type SortOption } from './parts/CatSortSelect';
import { GroupCard } from './parts/GroupCard';

const Groups = () => {
    const navigate = useAppNavigate();

    const { t } = useTranslation('group');

    const { groups, isLoading } = useGroups({ status: 'all', genre: 'all', sortBy: 'popularity' });
    const { query, setQuery, sortBy, setSortBy, visible } = useGroupFilters(groups);

    const sortOptions: SortOption<GroupSortBy>[] = [
        { key: 'followers', label: t('filters.sortMostFollowers'), icon: Users },
        { key: 'chapters', label: t('filters.sortMostChapters'), icon: Layers },
        { key: 'alpha', label: t('filters.sortAlpha'), icon: ArrowDownAZ },
    ];

    return (
        <PageContainer asMain size="default" paddingY="md">
            <header className="mb-[18px]">
                <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-[0.1em] text-mr-accent">{t('page.eyebrow')}</div>
                <h1 className="m-0 text-[clamp(22px,4vw,28px)] font-mr-bold tracking-mr text-mr-fg">{t('page.title')}</h1>
                <p className="mt-1.5 max-w-[560px] text-mr-small leading-normal text-mr-gray-200">{t('page.sub')}</p>
            </header>

            <div className="mb-[18px] flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1">
                    <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mr-tertiary"
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('filters.searchPlaceholder')}
                        aria-label={t('filters.searchPlaceholder')}
                        className="h-10 w-full rounded-mr-xs border border-mr-gray-700 bg-mr-secondary pl-8 pr-3 text-mr-small tracking-mr text-mr-fg outline-none focus:border-mr-accent"
                    />
                </div>
                <CatSortSelect value={sortBy} options={sortOptions} onChange={setSortBy} />
            </div>

            {isLoading ? (
                <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(366px, 1fr))' }}>
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="h-[230px] animate-mr-pulse rounded-mr-sm border border-[#333] bg-mr-gray-900" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(366px, 100%), 1fr))' }}>
                    {visible.map(g => (
                        <GroupCard key={g.id} group={g} onOpen={() => navigate(ROUTES.GROUP_DETAIL(g.id))} />
                    ))}
                </div>
            )}
        </PageContainer>
    );
};

export default Groups;
