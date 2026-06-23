import { useTranslation } from 'react-i18next';

import { Group } from '../../model/group.types';
import GroupCard from './GroupCard';

type GroupsContainerProps = {
    groups: Group[];
    isLoading?: boolean;
    title?: string;
};

const loadingGroup = {
    id: 'loading',
    name: '',
    status: 'inactive' as const,
    members: 0,
    projects: 0,
    chaptersPublished: 0,
};

const toGroupCardData = (group: Group) => ({
    id: group.id,
    name: group.name,
    handle: group.username,
    avatar: group.logo,
    banner: group.banner,
    status: group.status,
    members: group.members.length,
    projects: group.totalTitles,
    chaptersPublished: group.translatedWorks.length,
    tags: group.focusTags,
});

const GroupsContainer = ({ groups, isLoading = false, title }: GroupsContainerProps) => {
    const { t } = useTranslation('group');
    const resolvedTitle = title ?? t('container.defaultTitle');

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {resolvedTitle && <h2 className="text-lg font-bold">{resolvedTitle}</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <GroupCard key={index} group={loadingGroup} isLoading={true} />
                    ))}
                </div>
            </div>
        );
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                {resolvedTitle && <h2 className="text-lg font-bold">{resolvedTitle}</h2>}
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-tertiary text-center text-sm">{t('container.empty')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {resolvedTitle && <h2 className="text-lg font-bold">{resolvedTitle}</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-4">
                {groups.map(group => (
                    <GroupCard key={group.id} group={toGroupCardData(group)} isLoading={false} />
                ))}
            </div>
        </div>
    );
};

export default GroupsContainer;
