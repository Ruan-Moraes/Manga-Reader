import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';
import { getStoredSession } from '@shared/service/session';
import { showInfoToast } from '@shared/service/util/toastService';
import { Badge } from '@ui/Badge';
import { useSupportGroup, type Group } from '@entities/group';

import { SquareAvatar } from '@ui/SquareAvatar';

interface GroupCardProps {
    group: Group;
    onOpen: () => void;
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export const GroupCard = ({ group, onOpen }: GroupCardProps) => {
    const { t } = useTranslation('group');

    const currentUserId = getStoredSession()?.userId;
    // Membro (equipe) já conta como seguidor automaticamente — ver GroupProfile.
    const isMember = group.members.some(m => m.id === currentUserId);

    const initialSupportState = useMemo(
        () => ({
            following: group.supporters.some(s => s.id === currentUserId),
            supportersCount: group.supporters.length,
        }),
        [group, currentUserId],
    );
    const { following, supportersCount, pending, toggle } = useSupportGroup(group.id, currentUserId, initialSupportState);

    const followers = group.members.length + supportersCount;

    const handleFollowClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isMember) {
            showInfoToast(t('profile.memberAlreadyFollows'));
            return;
        }

        toggle();
    };

    return (
        <div
            onClick={onOpen}
            data-testid="group-card"
            className="group flex cursor-pointer flex-col overflow-hidden rounded-mr-sm border border-mr-border bg-mr-gray-900 transition-[border-color,box-shadow] duration-mr-default hover:border-mr-accent-border hover:shadow-mr-elevated"
        >
            <div
                className="relative h-16"
                style={{ background: group.banner ? `center/cover no-repeat url(${group.banner})` : 'var(--mr-poster-gradient)' }}
            >
                <SquareAvatar
                    name={group.name}
                    logo={group.logo || undefined}
                    size={48}
                    fontSize={16}
                    className="tracking-mr absolute -bottom-[22px] left-[14px] border-2 border-mr-gray-900"
                />
            </div>

            <div className="px-[14px] pb-[14px] pt-[30px]">
                <div className="mb-0.5 text-mr-body font-mr-bold text-mr-fg tracking-mr">{group.name}</div>
                <div className="mb-2.5 text-mr-tiny text-mr-fg-muted">@{group.username}</div>
                <p className="mb-3 line-clamp-2 text-mr-small leading-relaxed text-mr-gray-200">{group.description}</p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                    {group.genres.slice(0, 3).map(g => (
                        <Badge key={g} variant="neutral">
                            {g}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-mr-border pt-2.5">
                    <div className="flex gap-3.5 text-mr-tiny text-mr-fg-muted">
                        <span>
                            <strong className="font-mr-extrabold text-mr-accent-fg">{compact(followers)}</strong> {t('card.followers')}
                        </span>
                        <span>
                            <strong className="font-mr-extrabold text-mr-fg">{group.totalTitles}</strong> {t('card.works')}
                        </span>
                    </div>
                    {/*TODO: Usar o botao padrao da aplicao*/}
                    <button
                        type="button"
                        onClick={handleFollowClick}
                        disabled={pending}
                        className={cn(
                            'min-h-11 rounded-mr-xs border border-mr-accent-border px-2.5 py-1.5 text-mr-tiny font-mr-extrabold tracking-mr cursor-pointer mr-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
                            following || isMember ? 'bg-transparent text-mr-accent-fg' : 'bg-mr-accent text-mr-on-accent',
                        )}
                    >
                        {isMember ? t('profile.member') : following ? t('card.following') : t('card.follow')}
                    </button>
                </div>
            </div>
        </div>
    );
};
