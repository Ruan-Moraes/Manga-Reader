import { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Button } from '@ui/Button';

import { useGroups, type GroupStatus } from '@entities/group';

import { GroupFilters, type SortBy } from './parts/GroupFilters';
import { GroupList } from './parts/GroupList';

const Groups = () => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('group');
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('popularity');
    const [statusFilter, setStatusFilter] = useState<'all' | GroupStatus>('all');

    const { groups, isLoading } = useGroups({
        status: statusFilter,
        genre: 'all',
        sortBy,
        query,
    });

    return (
        <PageContainer asMain size="wide" paddingY="md">
            <SectionHeader
                eyebrow={t('page.eyebrow')}
                title={t('page.title')}
                meta={t('page.meta', { count: groups.length })}
                action={
                    <Button variant="raised" icon={Users}>
                        {t('page.claimGroup')}
                    </Button>
                }
                className="mb-6"
            />

            <GroupFilters query={query} sortBy={sortBy} statusFilter={statusFilter} onQuery={setQuery} onSort={setSortBy} onStatus={setStatusFilter} />

            <GroupList groups={groups} isLoading={isLoading} onGroupClick={id => navigate(`/groups/${id}`)} />
        </PageContainer>
    );
};

export default Groups;
