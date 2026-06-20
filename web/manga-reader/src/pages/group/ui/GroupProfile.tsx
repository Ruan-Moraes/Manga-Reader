// TODO: Usar o container oficial do projeto (PagContainer), ele esta ruim de largura no geral, eu quero que ele tenha a largura default.

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { cn } from '@shared/lib/cn';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { useGroupDetails, type Group } from '@entities/group';

import { SquareAvatar } from '@ui/SquareAvatar';
import { GroupAbout, GroupDiscussion, GroupTeam, GroupWorks } from './parts/GroupTabs';

type Tab = 'about' | 'works' | 'team' | 'discussion';

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const totalChapters = (g: Group) => (g.translatedWorks ?? []).reduce((sum, w) => sum + (w.chapters ?? 0), 0);

const GroupProfile = () => {
    const { groupId } = useParams();

    const navigate = useAppNavigate();

    const { t } = useTranslation('group');

    const { group, isLoading } = useGroupDetails(groupId);
    const [following, setFollowing] = useState(false);
    const [tab, setTab] = useState<Tab>('about');

    const stats = useMemo(
        () =>
            group
                ? [
                      { label: t('profile.statFollowers'), value: compact(group.supporters?.length ?? 0) },
                      { label: t('profile.statWorks'), value: String(group.totalTitles) },
                      { label: t('profile.statChapters'), value: String(totalChapters(group)) },
                      { label: t('profile.statMembers'), value: String(group.members.length) },
                  ]
                : [],
        [group, t],
    );

    // TODO: USAR O LOADING PADRAO DA APLICACAO
    if (isLoading) {
        return (
            <div className="mx-auto max-w-[1240px]">
                <div className="h-[180px] animate-mr-pulse bg-mr-gray-900" />
                <div className="px-4">
                    <div className="-mt-11 size-[88px] animate-mr-pulse rounded-mr-xs border-[3px] border-mr-primary bg-mr-gray-800" />
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="mx-auto max-w-[1240px] px-4 py-10">
                <EmptyState
                    illustration="404"
                    title={t('profile.notFoundTitle')}
                    description={t('profile.notFoundDesc')}
                    action={
                        <Button variant="primary" onClick={() => navigate(ROUTES.GROUPS)}>
                            {t('profile.backToGroupsShort')}
                        </Button>
                    }
                />
            </div>
        );
    }

    const tabs: Array<[Tab, string]> = [
        ['about', t('profile.tabAbout')],
        ['works', t('profile.tabWorks')],
        ['team', t('profile.tabTeam')],
        ['discussion', t('profile.tabDiscussion')],
    ];

    return (
        <main className="mx-auto max-w-[1240px]">
            <div
                className="relative h-[180px]"
                style={{ background: group.banner ? `center/cover no-repeat url(${group.banner})` : 'linear-gradient(135deg,#2a1f0f,#161616)' }}
            >
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.GROUPS)}
                    className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-mr-xs border border-mr-gray-700 bg-[rgba(22,22,22,0.7)] px-2.5 py-2 text-mr-small font-mr-bold tracking-mr text-mr-fg backdrop-blur-sm cursor-pointer mr-focus-ring"
                >
                    <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    {t('profile.back')}
                </button>
            </div>

            <div className="relative -mt-11 px-4">
                <div className="flex flex-wrap items-end gap-3.5">
                    <SquareAvatar name={group.name} logo={group.logo || undefined} size={88} fontSize={28} className="tracking-mr border-[3px] border-mr-primary" />
                    <div className="min-w-0 flex-[1_1_240px] pb-1.5">
                        <h1 className="m-0 text-[clamp(20px,4vw,26px)] font-mr-bold tracking-mr text-mr-fg">{group.name}</h1>
                        <div className="mt-0.5 text-mr-small text-mr-fg-muted">
                            @{group.username} · {t('profile.since', { year: group.foundedYear })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFollowing(f => !f)}
                        className={cn(
                            'inline-flex h-10 items-center gap-1.5 rounded-mr-xs border border-mr-accent px-[18px] text-mr-small font-mr-extrabold tracking-mr cursor-pointer mr-focus-ring',
                            following ? 'bg-transparent text-mr-accent' : 'bg-mr-accent text-mr-primary',
                        )}
                    >
                        {following && <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />}
                        {following ? t('profile.following') : t('profile.followGroup')}
                    </button>
                </div>

                <div className="mt-[18px] flex flex-wrap gap-6 border-b border-[#333] pb-3.5">
                    {stats.map(s => (
                        <div key={s.label}>
                            <div className="text-mr-h3 font-mr-extrabold text-mr-accent">{s.value}</div>
                            <div className="text-mr-tiny font-mr-bold uppercase tracking-[0.08em] text-mr-fg-muted">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap border-b border-[#333]">
                    {tabs.map(([k, label]) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setTab(k)}
                            className={cn(
                                'border-b-2 px-4 py-3 text-mr-small font-mr-bold tracking-mr cursor-pointer',
                                tab === k ? 'border-mr-accent text-mr-accent' : 'border-transparent text-mr-fg-muted hover:text-mr-fg',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="py-[18px] pb-[60px]">
                    {tab === 'about' && <GroupAbout group={group} />}
                    {tab === 'works' && <GroupWorks group={group} onOpenTitle={id => navigate(ROUTES.TITLE_DETAIL(id))} />}
                    {tab === 'team' && <GroupTeam group={group} />}
                    {tab === 'discussion' && <GroupDiscussion onViewForum={() => navigate(ROUTES.FORUM)} />}
                </div>
            </div>
        </main>
    );
};

export default GroupProfile;
