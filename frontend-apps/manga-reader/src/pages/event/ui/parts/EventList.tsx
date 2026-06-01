import { useTranslation } from 'react-i18next';

import { EventCard, formatEventDate, type EventData, type EventType } from '@entities/event';
import { EmptyState } from '@ui/EmptyState';
import { Skeleton } from '@ui/Skeleton';


const TYPE_MAP: Record<EventType, 'launch' | 'meetup' | 'stream' | 'announcement'> = {
    Lançamento: 'launch',
    Meetup: 'meetup',
    Convenção: 'meetup',
    Live: 'stream',
    Workshop: 'announcement',
};

interface EventListProps {
    events: EventData[];
    featured: EventData | null | undefined;
    isLoading: boolean;
    onEventClick: (id: string) => void;
}

export const EventList = ({ events, featured, isLoading, onEventClick }: EventListProps) => {
    const { t } = useTranslation('event');
    const regular = events.filter(e => e !== featured);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} variant="rect" height={160} className="rounded-mr-md" />
                ))}
            </div>
        );
    }

    if (events.length === 0) {
        return <EmptyState illustration="duvida" title={t('page.emptyTitle')} description={t('page.emptyDescription')} />;
    }

    return (
        <>
            {featured && (
                <section className="mb-8">
                    <p className="mr-label mb-3 text-mr-accent">{t('page.featuredLabel')}</p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <EventCard
                            event={{
                                id: featured.id,
                                title: featured.title,
                                type: TYPE_MAP[featured.type] ?? 'announcement',
                                when: formatEventDate(featured.startDate),
                                location: featured.location.isOnline ? 'Online' : featured.location.city,
                                coverImage: featured.image || undefined,
                                organizer: {
                                    name: featured.organizer.name,
                                    avatar: featured.organizer.avatar,
                                },
                                attendees: featured.participants,
                                going: featured.amIParticipating,
                                special: true,
                                past: featured.timeline === 'past',
                            }}
                            onClick={() => onEventClick(featured.id)}
                        />
                    </div>
                </section>
            )}

            {regular.length > 0 && (
                <section>
                    {featured && <p className="mr-label mb-3 text-mr-fg-subtle">{t('page.allEventsLabel')}</p>}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {regular.map(e => (
                            <EventCard
                                key={e.id}
                                event={{
                                    id: e.id,
                                    title: e.title,
                                    type: TYPE_MAP[e.type] ?? 'announcement',
                                    when: formatEventDate(e.startDate),
                                    location: e.location.isOnline ? 'Online' : e.location.city,
                                    coverImage: e.image || undefined,
                                    attendees: e.participants,
                                    going: e.amIParticipating,
                                    past: e.timeline === 'past',
                                }}
                                onClick={() => onEventClick(e.id)}
                            />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
};
