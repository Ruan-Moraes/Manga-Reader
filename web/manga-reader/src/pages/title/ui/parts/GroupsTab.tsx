import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { GroupCard, type GroupSummary } from '@entities/group';
import { EmptyState } from '@ui/EmptyState';


type GroupsTabProps = {
    groups: GroupSummary[];
};

const GroupsTab = ({ groups }: GroupsTabProps) => {
    const navigate = useAppNavigate();
    const { t } = useTranslation('manga');

    if (groups.length === 0) {
        return <EmptyState illustration="pensando" title={t('titleDetails.noGroups')} />;
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {groups.map(g => (
                <GroupCard
                    key={g.id}
                    group={{
                        id: g.id,
                        name: g.name,
                        handle: g.username,
                        avatar: g.logo,
                        banner: g.banner,
                        status: g.status,
                        members: 0,
                        projects: g.totalTitles,
                        chaptersPublished: 0,
                        tags: g.focusTags,
                    }}
                    onClick={() => navigate(ROUTES.GROUP_DETAIL(g.id))}
                />
            ))}
        </div>
    );
};

export default GroupsTab;
