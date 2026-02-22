import { useState } from 'react';
import { IoImageOutline } from 'react-icons/io5';

import { RatingStars } from '@feature/rating';
import AppLink from '@shared/component/link/element/AppLink';
import formatRelativeDate from '@shared/service/util/formatRelativeDate';

import { getGroupStatusLabel } from '../../service/groupService';
import { Group } from '../../type/group.types';

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
    group: Group;
};

const GroupSummaryCard = ({ group }: GroupSummaryCardProps) => {
    const [avatarError, setAvatarError] = useState(false);

    const latestWork = group.translatedWorks.reduce<
        (typeof group.translatedWorks)[0] | null
    >((latest, work) => {
        if (!latest) return work;
        return new Date(work.updatedAt) > new Date(latest.updatedAt)
            ? work
            : latest;
    }, null);

    const totalChapters = group.translatedWorks.reduce(
        (sum, work) => sum + work.chapters,
        0,
    );

    return (
        <article className="flex flex-col gap-3 p-4 border rounded-xs border-tertiary bg-secondary/40">
            <div className="flex gap-3 items-center">
                <div className="shrink-0 w-12 h-12 rounded-full border border-quaternary overflow-hidden">
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
                                size={20}
                                className="text-tertiary"
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <AppLink
                        link={`/groups/${group.id}`}
                        text={group.name}
                        className="text-sm truncate"
                    />
                    <span
                        className={`flex items-center gap-1.5 text-xs ${statusTextMap[group.status] ?? 'text-tertiary'}`}
                    >
                        <span
                            className={`inline-block w-2 h-2 rounded-full ${statusColorMap[group.status] ?? 'bg-tertiary'}`}
                        />
                        {getGroupStatusLabel(group.status)}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-tertiary">Qualidade</span>
                    <RatingStars value={group.rating} size={12} showValue />
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-tertiary">Capítulos traduzidos</span>
                    <span className="font-semibold">{totalChapters}</span>
                </div>
                {latestWork && (
                    <div className="flex items-center justify-between">
                        <span className="text-tertiary">Último lançamento</span>
                        <span className="font-semibold">
                            {formatRelativeDate(latestWork.updatedAt)}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-1">
                <AppLink
                    link={`/groups/${group.id}`}
                    text="Ver detalhes"
                    className="flex-1 px-3 py-1.5 text-xs text-center border rounded-xs border-tertiary hover:border-quaternary transition-colors"
                />
            </div>
        </article>
    );
};

export default GroupSummaryCard;
