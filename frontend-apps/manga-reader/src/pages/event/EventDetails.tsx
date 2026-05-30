import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { PageContainer } from '@ui/PageContainer';
import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';

import { useEventDetails } from '@features/event';
import EventHero from './parts/EventHero';
import EventBody from './parts/EventBody';
import EventSidebar from './parts/EventSidebar';

const EventDetails = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useAppNavigate();
    const { t } = useTranslation('event');

    const { event, relatedEvents, isLoading, isError } = useEventDetails(eventId ?? '');

    if (isLoading) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <Skeleton variant="rect" height={320} className="mb-6 rounded-2xl" />
                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2 flex flex-col gap-4">
                        <Skeleton variant="rect" height={200} className="rounded-xl" />
                        <Skeleton variant="rect" height={160} className="rounded-xl" />
                    </div>
                    <Skeleton variant="rect" height={360} className="rounded-xl" />
                </div>
            </PageContainer>
        );
    }

    if (isError || !event) {
        return (
            <PageContainer asMain size="default" paddingY="md">
                <EmptyState
                    illustration="404"
                    title={t('notFound')}
                    description={t('notFoundDesc')}
                    action={
                        <Button variant="primary" onClick={() => navigate('/events')}>
                            {t('backToEventsShort')}
                        </Button>
                    }
                />
            </PageContainer>
        );
    }

    return (
        <PageContainer asMain size="default" paddingY="md">
            <EventHero event={event} />
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <EventBody event={event} />
                <EventSidebar event={event} relatedEvents={relatedEvents} />
            </div>
        </PageContainer>
    );
};

export default EventDetails;
