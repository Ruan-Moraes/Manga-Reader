import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import { ActivityEventRow, useActivityFeed } from '@entities/activity';
import { HideActivityEventAction } from '@features/hide-activity-event';

type ActivityTabProps = {
    profileUserId?: string;
    isOwn: boolean;
};

const ActivityTab = ({ profileUserId, isOwn }: ActivityTabProps) => {
    const { t } = useTranslation('user');

    const { events, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useActivityFeed(profileUserId);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[52px] w-full rounded-mr-xs" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                illustration="pensando"
                title={t('profile.activity.loadError')}
                action={
                    <Button variant="ghost" onClick={() => void refetch()}>
                        {t('profile.activity.retry')}
                    </Button>
                }
            />
        );
    }

    if (events.length === 0) {
        return <EmptyState illustration="surpresa" title={t('profile.noActivity')} />;
    }

    return (
        <div className="flex flex-col gap-2">
            {events.map(event => (
                <ActivityEventRow
                    key={event.id}
                    event={event}
                    actions={isOwn ? <HideActivityEventAction eventId={event.id} /> : undefined}
                />
            ))}

            {hasNextPage && (
                <Button
                    variant="ghost"
                    className="self-center"
                    loading={isFetchingNextPage}
                    disabled={isFetchingNextPage}
                    onClick={() => fetchNextPage()}
                >
                    {t('profile.activity.loadMore')}
                </Button>
            )}
        </div>
    );
};

export default ActivityTab;
