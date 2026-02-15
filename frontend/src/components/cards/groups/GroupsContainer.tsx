import { GroupTypes } from '../../../types/GroupTypes';
import GroupCard from './GroupCard';

type GroupsContainerProps = {
    groups: GroupTypes[];
    isLoading?: boolean;
    title?: string;
};

const GroupsContainer = ({
    groups,
    isLoading = false,
    title = 'Grupos de Tradução',
}: GroupsContainerProps) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                {title && <h2 className="text-lg font-bold">{title}</h2>}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <GroupCard
                            key={index}
                            group={{} as GroupTypes}
                            isLoading={true}
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                {title && <h2 className="text-lg font-bold">{title}</h2>}
                <div className="flex items-center justify-center p-4 border border-dashed border-tertiary rounded-xs">
                    <p className="text-tertiary text-center text-sm">
                        Nenhum grupo de tradução encontrado para esta obra.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {title && <h2 className="text-lg font-bold">{title}</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-2 gap-y-4">
                {groups.map(group => (
                    <GroupCard key={group.id} group={group} isLoading={false} />
                ))}
            </div>
        </div>
    );
};

export default GroupsContainer;
