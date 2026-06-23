import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';
import { Badge } from '@ui/Badge';
import type { Group } from '@entities/group';

import { SquareAvatar } from '@ui/SquareAvatar';

interface GroupCardProps {
    group: Group;
    onOpen: () => void;
    following: boolean;
    onToggleFollow: () => void;
}

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export const GroupCard = ({ group, onOpen, following, onToggleFollow }: GroupCardProps) => {
    const { t } = useTranslation('group');

    const followers = group.supporters?.length ?? 0;

    return (
        <div
            onClick={onOpen}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-mr-sm border border-[#333] bg-mr-gray-900 transition-[border-color,box-shadow] duration-mr-default hover:border-mr-accent hover:shadow-mr-elevated"
        >
            <div className="relative h-16" style={{ background: group.banner ? `center/cover no-repeat url(${group.banner})` : 'linear-gradient(135deg,#2a1f0f,#161616)' }}>
                <SquareAvatar name={group.name} logo={group.logo || undefined} size={48} fontSize={16} className="tracking-mr absolute -bottom-[22px] left-[14px] border-2 border-mr-gray-900" />
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

                <div className="flex items-center justify-between border-t border-[#333] pt-2.5">
                    <div className="flex gap-3.5 text-mr-tiny text-mr-fg-muted">
                        <span>
                            <strong className="font-mr-extrabold text-mr-accent">{compact(followers)}</strong> {t('card.followers')}
                        </span>
                        <span>
                            <strong className="font-mr-extrabold text-mr-fg">{group.totalTitles}</strong> {t('card.works')}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={e => {
                            e.stopPropagation();
                            onToggleFollow();
                        }}
                        className={cn(
                            'min-h-11 rounded-mr-xs border border-mr-accent px-2.5 py-1.5 text-mr-tiny font-mr-extrabold tracking-mr cursor-pointer mr-focus-ring',
                            following ? 'bg-transparent text-mr-accent' : 'bg-mr-accent text-mr-primary',
                        )}
                    >
                        {following ? t('card.following') : t('card.follow')}
                    </button>
                </div>
            </div>
        </div>
    );
};
