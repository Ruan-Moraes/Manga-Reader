import { useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import AppLink from '@shared/component/link/element/AppLink';

import { getGroupStatusLabel } from '../../service/groupService';

import { GroupSummary } from '@feature/group';
import { RatingStars } from '@feature/rating';

const statusColorMap: Record<string, string> = {
    active: 'bg-green-400',
    hiatus: 'bg-yellow-400',
    inactive: 'bg-red-400',
};

const statusTextMap: Record<string, string> = {
    active: 'text-green-400',
    hiatus: 'text-yellow-400',
    inactive: 'text-red-400',
};

type GroupSummaryCardProps = {
    group: GroupSummary;
};

const MAX_TAGS = 5;

const GroupSummaryCard = ({ group }: GroupSummaryCardProps) => {
    const [avatarError, setAvatarError] = useState(false);

    const displayTags =
        group.focusTags.length > 0 ? group.focusTags.slice(0, MAX_TAGS) : null;

    return (
        <article className="flex flex-col gap-4 p-4 border rounded-xs border-tertiary bg-secondary/40 hover:border-quaternary-opacity-50 transition-colors">
            <div className="flex gap-3 items-center">
                <div className="shrink-0 w-14 h-14 rounded-full border border-quaternary-default overflow-hidden">
                    {!avatarError ? (
                        <img
                            src={group.logo}
                            alt={`Avatar do grupo ${group.name}`}
                            onError={() => setAvatarError(true)}
                            className="object-cover w-full h-full"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-secondary">
                            <IoImageOutline
                                size={24}
                                className="text-tertiary"
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <AppLink
                        link={`groups/${group.id}`}
                        text={group.name}
                        className="text-sm font-bold truncate"
                    />
                    <span className="text-xs text-tertiary truncate">
                        {group.username}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div className="flex flex-col gap-1">
                    <span className="text-tertiary font-semibold uppercase tracking-wide text-[0.6rem]">
                        Status
                    </span>
                    <span
                        className={`flex items-center gap-1.5 ${statusTextMap[group.status] ?? 'text-tertiary'}`}
                    >
                        <span
                            className={`inline-block w-2 h-2 rounded-full ${statusColorMap[group.status] ?? 'bg-tertiary'}`}
                        />
                        {getGroupStatusLabel(group.status)}
                    </span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-tertiary font-semibold uppercase tracking-wide text-[0.6rem]">
                        Tags de foco
                    </span>
                    {displayTags ? (
                        <div className="flex flex-wrap gap-1">
                            {displayTags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 text-[0.65rem] rounded-full border border-tertiary bg-primary-default"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-tertiary italic">
                            Sem tags definidas
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-tertiary font-semibold uppercase tracking-wide text-[0.6rem]">
                        Nota
                    </span>
                    <RatingStars value={group.rating} size={12} showValue />
                </div>
            </div>
            <AppLink
                link={`groups/${group.id}`}
                text="Ver detalhes do grupo"
                className="w-full px-3 py-2 text-xs text-center border rounded-xs border-tertiary hover:border-quaternary-default transition-colors"
            />
        </article>
    );
};

export default GroupSummaryCard;
