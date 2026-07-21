import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';

import { getGroupStatusLabelKey } from '../../api/groupService';
import { Group } from '../../model/group.types';
import { ExternalLink, Users } from 'lucide-react';

const BANNER_FALLBACK = 'var(--mr-banner-gradient)';

type GroupDetailHeaderProps = {
    group: Group;
    onOpenMembers: () => void;
};

const statusClassMap = {
    active: 'text-mr-success border-mr-success/40',
    hiatus: 'text-mr-warning border-mr-warning/40',
    inactive: 'text-mr-danger border-mr-danger/40',
};

const GroupDetailHeader = ({ group, onOpenMembers }: GroupDetailHeaderProps) => {
    const { t } = useTranslation('group');

    return (
        <section className="overflow-hidden border rounded-xs border-tertiary bg-secondary/40">
            <div className="relative h-40 mobile-lg:h-52">
                {group.banner ? (
                    <img src={group.banner} alt={t('header.bannerAlt', { name: group.name })} className="object-cover w-full h-full" />
                ) : (
                    <div className="w-full h-full" style={{ background: BANNER_FALLBACK }} aria-hidden="true" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent" />
            </div>

            <div className="relative p-4 -mt-12">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="flex gap-4 items-end">
                        <div className="overflow-hidden border-2 rounded-mr-xs border-mr-accent-border" aria-label={t('header.avatarAlt', { name: group.name })}>
                            <Avatar src={group.logo || undefined} name={group.name} size={96} />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold">{group.name}</h2>
                            <span className={`inline-flex mt-1 px-2 py-1 text-xs border rounded-xs ${statusClassMap[group.status]}`}>
                                {t(getGroupStatusLabelKey(group.status))}
                            </span>
                        </div>
                    </div>

                    <a
                        href={group.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex gap-2 items-center text-sm text-tertiary transition-colors hover:text-mr-accent-fg"
                    >
                        {t('header.officialSite')} <ExternalLink />
                    </a>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-sm mobile-lg:grid-cols-5">
                    <button
                        onClick={onOpenMembers}
                        className="flex gap-2 justify-center items-center p-2 border rounded-xs border-tertiary hover:border-mr-accent-border transition-colors"
                    >
                        <Users />
                        {t('card.membersCount', {
                            count: group.members.length,
                        })}
                    </button>
                    <div className="p-2 text-center border rounded-xs border-tertiary">
                        {t('header.supporters', {
                            count: group.supporters?.length ?? 0,
                        })}
                    </div>
                    <div className="p-2 text-center border rounded-xs border-tertiary">{t('card.worksCount', { count: group.totalTitles })}</div>
                    <div className="p-2 text-center border rounded-xs border-tertiary">⭐ {group.rating.toFixed(1)}</div>
                    <div className="p-2 text-center border rounded-xs border-tertiary">🔥 {group.popularity}</div>
                </div>
            </div>
        </section>
    );
};

export default GroupDetailHeader;
