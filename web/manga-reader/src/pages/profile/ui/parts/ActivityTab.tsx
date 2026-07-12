import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import { ActivityEventRow, useActivityFeed, useHideActivityEvent } from '@entities/activity';

type ActivityTabProps = {
    profileUserId?: string;
};

const ActivityTab = ({ profileUserId }: ActivityTabProps) => {
    const { t } = useTranslation('user');

    const { events, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useActivityFeed(profileUserId);
    const hideEventMutation = useHideActivityEvent();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[52px] w-full rounded-mr-xs" />
                ))}
            </div>
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
                    onHide={() => hideEventMutation.mutate(event.id)}
                    hiding={hideEventMutation.isPending}
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
