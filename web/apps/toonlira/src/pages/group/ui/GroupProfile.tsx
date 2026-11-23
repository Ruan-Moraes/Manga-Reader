import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { cn } from '@shared/lib/cn';
import { getStoredSession } from '@shared/service/session';
import { showInfoToast } from '@shared/service/util/toastService';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { PageContainer } from '@ui/PageContainer';
import { Skeleton } from '@ui/Skeleton';
import { useGroupDetails, usePagedGroupWorks, useSupportGroup, type Group } from '@entities/group';

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
    const currentUserId = getStoredSession()?.userId;
    // Membro (equipe) já conta como seguidor automaticamente — só quem não é
    // membro tem o toggle normal de seguir/deixar de seguir (ver useSupportGroup).
    const isMember = group ? group.members.some(m => m.id === currentUserId) : false;

    const initialSupportState = useMemo(
        () => ({
            following: group ? group.supporters.some(s => s.id === currentUserId) : false,
            supportersCount: group?.supporters.length ?? 0,
        }),
        [group, currentUserId],
    );
    const { following, supportersCount, pending, toggle } = useSupportGroup(groupId, currentUserId, initialSupportState);

    const [tab, setTab] = useState<Tab>('about');
    const [worksPage, setWorksPage] = useState(0);
    const pagedWorks = usePagedGroupWorks(tab === 'works' ? groupId : undefined, worksPage);

    const followersCount = group ? group.members.length + supportersCount : 0;

    const stats = useMemo(
        () =>
            group
                ? [
                      { label: t('profile.statFollowers'), value: compact(followersCount) },
                      { label: t('profile.statWorks'), value: String(group.totalTitles) },
                      { label: t('profile.statChapters'), value: String(totalChapters(group)) },
                      { label: t('profile.statMembers'), value: String(group.members.length) },
                  ]
                : [],
        [group, followersCount, t],
    );

    const handleFollowClick = () => {
        if (isMember) {
            showInfoToast(t('profile.memberAlreadyFollows'));
            return;
        }
        toggle();
    };

    if (isLoading) {
        return (
            <PageContainer asMain size="default" paddingY="none">
                <Skeleton className="h-[180px] w-full" />
                <Skeleton variant="rect" width={88} height={88} className="-mt-11 border-[3px] border-ui-primary" />
            </PageContainer>
        );
    }

    if (!group) {
        return (
            <PageContainer asMain size="default" paddingY="lg">
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
            </PageContainer>
        );
    }

    const tabs: Array<[Tab, string]> = [
        ['about', t('profile.tabAbout')],
        ['works', t('profile.tabWorks')],
        ['team', t('profile.tabTeam')],
        ['discussion', t('profile.tabDiscussion')],
    ];

    return (
        <PageContainer asMain size="default" paddingY="none">
            <div
                className="relative h-[180px]"
                style={{ background: group.banner ? `center/cover no-repeat url(${group.banner})` : 'var(--ui-poster-gradient)' }}
            >
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.GROUPS)}
                    className="absolute left-3 top-3 inline-flex cursor-pointer items-center gap-1 rounded-ui-xs border border-ui-on-overlay/30 bg-ui-overlay px-2.5 py-2 text-ui-small font-ui-bold tracking-mr text-ui-on-overlay backdrop-blur-sm ui-focus-ring"
                >
                    <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    {t('profile.back')}
                </button>
            </div>

            <div className="relative -mt-11">
                <div className="flex flex-wrap items-end gap-3.5">
                    <SquareAvatar name={group.name} logo={group.logo || undefined} size={88} fontSize={28} className="tracking-mr border-[3px] border-ui-primary" />
                    <div className="min-w-0 flex-[1_1_240px] pb-1.5">
                        <h1 className="m-0 text-[clamp(20px,4vw,26px)] font-ui-bold tracking-mr text-ui-fg">{group.name}</h1>
                        <div className="mt-0.5 text-ui-small text-ui-fg-muted">
                            @{group.username} · {t('profile.since', { year: group.foundedYear })}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleFollowClick}
                        disabled={pending}
                        className={cn(
                            'inline-flex h-10 items-center gap-1.5 rounded-ui-xs border border-ui-accent-border px-[18px] text-ui-small font-ui-extrabold tracking-mr cursor-pointer ui-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
                            following || isMember ? 'bg-transparent text-ui-accent-fg' : 'bg-ui-accent text-ui-on-accent',
                        )}
                    >
                        {(following || isMember) && <Check className="size-3.5" strokeWidth={2} aria-hidden="true" />}
                        {isMember ? t('profile.member') : following ? t('profile.following') : t('profile.followGroup')}
                    </button>
                </div>

                <div className="mt-[18px] flex flex-wrap gap-6 border-b border-ui-border pb-3.5">
                    {stats.map(s => (
                        <div key={s.label}>
                            <div className="text-ui-h3 font-ui-extrabold text-ui-accent-fg">{s.value}</div>
                            <div className="text-ui-tiny font-ui-bold uppercase tracking-[0.08em] text-ui-fg-muted">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="flex overflow-x-auto whitespace-nowrap border-b border-ui-border">
                    {tabs.map(([k, label]) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => setTab(k)}
                            className={cn(
                                'border-b-2 px-4 py-3 text-ui-small font-ui-bold tracking-mr cursor-pointer',
                                tab === k ? 'border-ui-accent-border text-ui-accent-fg' : 'border-transparent text-ui-fg-muted hover:text-ui-fg',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="py-[18px] pb-[60px]">
                    {tab === 'about' && <GroupAbout group={group} />}
                    {tab === 'works' && (
                        <GroupWorks
                            group={group}
                            page={pagedWorks.data}
                            pageIndex={worksPage}
                            loading={pagedWorks.isLoading}
                            error={pagedWorks.isError}
                            onRetry={() => void pagedWorks.refetch()}
                            onPageChange={setWorksPage}
                            onOpenTitle={id => navigate(ROUTES.TITLE_DETAIL(id))}
                        />
                    )}
                    {tab === 'team' && <GroupTeam group={group} />}
                    {tab === 'discussion' && <GroupDiscussion onViewForum={() => navigate(ROUTES.FORUM)} />}
                </div>
            </div>
        </PageContainer>
    );
};

export default GroupProfile;
