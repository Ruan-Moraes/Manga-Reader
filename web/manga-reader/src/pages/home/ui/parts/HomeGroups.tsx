import { ROUTES } from '@shared/constant/ROUTES';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

import useAppNavigate from '@shared/hook/useAppNavigate';
import { SectionHeader } from '@ui/SectionHeader';
import { GroupCard, type Group } from '@entities/group';
import { Skeleton } from '@ui/Skeleton';
import { Button } from '@ui/Button';

type HomeGroupsProps = {
    groups: Group[];
};

const HomeGroups = ({ groups }: HomeGroupsProps) => {
    const navigate = useAppNavigate();

    const { t } = useTranslation('home');

    return (
        <section>
            <SectionHeader
                title={t('groups.title')}
                action={
                    <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(ROUTES.GROUPS)}>
                        {t('groups.viewGroups')}
                    </Button>
                }
                className="mb-6"
            />
            {groups.length === 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={220} className="rounded-mr-md" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map(g => (
                        <GroupCard
                            key={g.id}
                            group={{
                                id: g.id,
                                name: g.name,
                                handle: g.username,
                                avatar: g.logo,
                                banner: g.banner,
                                status: g.status,
                                members: g.members.length,
                                projects: g.totalTitles,
                                chaptersPublished: g.translatedWorks.reduce((s, w) => s + w.chapters, 0),
                                tags: g.focusTags,
                            }}
                            onClick={() => navigate(ROUTES.GROUP_DETAIL(g.id))}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HomeGroups;
