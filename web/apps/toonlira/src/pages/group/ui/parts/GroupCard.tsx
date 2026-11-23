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
            className="group flex cursor-pointer flex-col overflow-hidden rounded-ui-sm border border-ui-border bg-ui-gray-900 transition-[border-color,box-shadow] duration-ui-default hover:border-ui-accent-border hover:shadow-ui-elevated"
        >
            <div
                className="relative h-16"
                style={{ background: group.banner ? `center/cover no-repeat url(${group.banner})` : 'var(--ui-poster-gradient)' }}
            >
                <SquareAvatar
                    name={group.name}
                    logo={group.logo || undefined}
                    size={48}
                    fontSize={16}
                    className="tracking-mr absolute -bottom-[22px] left-[14px] border-2 border-ui-gray-900"
                />
            </div>

            <div className="px-[14px] pb-[14px] pt-[30px]">
                <div className="mb-0.5 text-ui-body font-ui-bold text-ui-fg tracking-mr">{group.name}</div>
                <div className="mb-2.5 text-ui-tiny text-ui-fg-muted">@{group.username}</div>
                <p className="mb-3 line-clamp-2 text-ui-small leading-relaxed text-ui-gray-200">{group.description}</p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                    {group.genres.slice(0, 3).map(g => (
                        <Badge key={g} variant="neutral">
                            {g}
                        </Badge>
                    ))}
                </div>

                <div className="flex items-center justify-between border-t border-ui-border pt-2.5">
                    <div className="flex gap-3.5 text-ui-tiny text-ui-fg-muted">
                        <span>
                            <strong className="font-ui-extrabold text-ui-accent-fg">{compact(followers)}</strong> {t('card.followers')}
                        </span>
                        <span>
                            <strong className="font-ui-extrabold text-ui-fg">{group.totalTitles}</strong> {t('card.works')}
                        </span>
                    </div>
                    {/*TODO: Usar o botao padrao da aplicao*/}
                    <button
                        type="button"
                        onClick={handleFollowClick}
                        disabled={pending}
                        className={cn(
                            'min-h-11 rounded-ui-xs border border-ui-accent-border px-2.5 py-1.5 text-ui-tiny font-ui-extrabold tracking-mr cursor-pointer ui-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
                            following || isMember ? 'bg-transparent text-ui-accent-fg' : 'bg-ui-accent text-ui-on-accent',
                        )}
                    >
                        {isMember ? t('profile.member') : following ? t('card.following') : t('card.follow')}
                    </button>
                </div>
            </div>
        </div>
    );
};
