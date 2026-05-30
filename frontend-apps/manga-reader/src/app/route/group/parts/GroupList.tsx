import { useTranslation } from 'react-i18next';

import { GroupCard } from '@ui/GroupCard';
import { Badge } from '@ui/Badge';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import type { Group } from '@feature/group';

interface GroupListProps {
    groups: Group[];
    isLoading: boolean;
    onGroupClick: (id: string) => void;
}

const toCardShape = (g: Group) => ({
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
});

export const GroupList = ({ groups, isLoading, onGroupClick }: GroupListProps) => {
    const { t } = useTranslation('group');

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" height={220} className="rounded-mr-md" />
                ))}
            </div>
        );
    }

    if (groups.length === 0) {
        return <EmptyState illustration="duvida" title={t('list.empty')} description={t('list.emptyDesc')} />;
    }

    const featured = groups.slice(0, 2);
    const rest = groups.slice(2);

    return (
        <>
            {featured.length > 0 && (
                <section className="mb-8">
                    <p className="mr-label mb-3 text-mr-accent">{t('list.featured')}</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {featured.map(g => (
                            <GroupCard key={g.id} group={toCardShape(g)} onClick={() => onGroupClick(g.id)} />
                        ))}
                    </div>
                </section>
            )}

            {rest.length > 0 && (
                <section>
                    {featured.length > 0 && (
                        <div className="mb-3 flex items-center gap-2">
                            <p className="mr-label text-mr-fg-subtle">{t('list.allGroups')}</p>
                            <Badge variant="neutral">{rest.length}</Badge>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {rest.map(g => (
                            <GroupCard key={g.id} group={toCardShape(g)} onClick={() => onGroupClick(g.id)} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};
