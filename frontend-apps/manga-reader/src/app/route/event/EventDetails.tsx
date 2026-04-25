import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FiCalendar,
    FiClock,
    FiMapPin,
    FiNavigation,
    FiUsers,
} from 'react-icons/fi';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';
import UserAvatar from '@shared/component/avatar/UserAvatar';

import {
    getEventById,
    getRelatedEvents,
    statusLabelKey,
} from '@feature/event';
import type { EventData } from '@feature/event';

// TODO: Refatorar esse componente, ele está muito grande e precisa ser dividido em subcomponentes menores para melhorar a legibilidade e manutenção. Talvez criar um componente específico para o leitor de capítulos, outro para a navegação entre capítulos e outro para os comentários.
const EventDetails = () => {
    const { eventId = '' } = useParams();
    const { t, i18n } = useTranslation('event');

    const [event, setEvent] = useState<EventData | null>(null);
    const [relatedEvents, setRelatedEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);

        getEventById(eventId)
            .then(data => {
                setEvent(data);

                return getRelatedEvents(data.id);
            })
            .then(setRelatedEvents)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [eventId]);

    if (isLoading) {
        return (
            <>
                <Header />
                <MainContent>
                    <p>{t('loading')}</p>
                </MainContent>
                <Footer />
            </>
        );
    }

    if (!event) {
        return (
            <>
                <Header />
                <MainContent>
                    <p>{t('notFound')}</p>
                    <Link
                        to="/Manga-Reader/events"
                        className="text-purple-400 underline"
                    >
                        {t('backToEvents')}
                    </Link>
                </MainContent>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <MainContent>
                <article className="space-y-5">
                    <section className="overflow-hidden border rounded-2xl border-tertiary bg-secondary">
                        <img
                            src={event.image}
                            alt={event.title}
                            className="object-cover w-full h-72"
                        />
                        <div className="p-5 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                                    {t(statusLabelKey[event.status])}
                                </span>
                                <span className="px-2 py-1 text-xs border rounded-full border-tertiary">
                                    {event.type}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold">
                                {event.title}
                            </h1>
                            <div className="flex items-center gap-3">
                                <UserAvatar
                                    src={event.organizer.avatar}
                                    name={event.organizer.name}
                                    size="md"
                                    rounded="full"
                                />
                                <Link
                                    to={event.organizer.profileLink}
                                    className="font-medium text-purple-400"
                                >
                                    {event.organizer.name}
                                </Link>
                            </div>
                        </div>
                    </section>
                    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                        <div className="space-y-4 xl:col-span-2">
                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    {t('details.schedule')}
                                </h2>
                                <p className="inline-flex items-center gap-2 text-sm text-tertiary">
                                    <FiClock />{' '}
                                    {t('details.startAt', {
                                        date: new Date(
                                            event.startDate,
                                        ).toLocaleString(i18n.language),
                                    })}
                                </p>
                                <p className="inline-flex items-center gap-2 ml-4 text-sm text-tertiary">
                                    <FiCalendar />{' '}
                                    {t('details.endAt', {
                                        date: new Date(
                                            event.endDate,
                                        ).toLocaleString(i18n.language),
                                    })}
                                </p>
                                <p className="text-sm text-tertiary">
                                    {t('details.timezone', {
                                        timezone: event.timezone,
                                    })}
                                </p>
                                <ul className="pl-5 text-sm list-disc">
                                    {event.schedule.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    {t('details.location')}
                                </h2>
                                <p className="inline-flex items-center gap-2 text-sm">
                                    <FiMapPin /> {event.location.address} -{' '}
                                    {event.location.city}
                                </p>
                                <div className="p-4 text-sm border border-dashed rounded-lg border-tertiary">
                                    {t('details.mapMock')}
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <a
                                        href={event.location.mapLink}
                                        className="text-purple-400 underline"
                                    >
                                        {t('details.openMaps')}
                                    </a>
                                    <a
                                        href={event.location.mapLink}
                                        className="text-purple-400 underline"
                                    >
                                        {t('details.openWaze')}
                                    </a>
                                </div>
                                <p className="text-sm text-tertiary">
                                    <FiNavigation className="inline mr-1" />
                                    {event.location.directions}
                                </p>
                            </div>

                            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    {t('details.description')}
                                </h2>
                                <p>{event.description}</p>
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {event.gallery.map(image => (
                                        <img
                                            key={image}
                                            src={image}
                                            alt={t('details.galleryAlt')}
                                            className="object-cover w-full rounded-lg h-36"
                                        />
                                    ))}
                                </div>
                                <p className="text-sm">
                                    <strong>{t('details.guests')}</strong>{' '}
                                    {event.specialGuests.join(', ')}
                                </p>
                            </div>

                            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                                <h2 className="text-xl font-semibold">
                                    {t('details.comments')}
                                </h2>
                                {event.comments.map(comment => (
                                    <div
                                        key={comment.id}
                                        className="p-3 text-sm rounded-lg bg-primary"
                                    >
                                        <p className="font-semibold">
                                            {comment.user}
                                        </p>
                                        <p>{comment.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="space-y-4">
                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    {t('details.tickets')}
                                </h3>
                                {event.tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        className="p-2 text-sm rounded-lg bg-primary"
                                    >
                                        <p className="font-medium">
                                            {ticket.name}
                                        </p>
                                        <p>{ticket.price}</p>
                                        <p className="text-tertiary">
                                            {t('details.ticketSlots', {
                                                count: ticket.available,
                                            })}
                                        </p>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="w-full py-2 mt-2 font-medium text-purple-900 bg-white rounded-lg"
                                >
                                    {t('details.register')}
                                </button>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    {t('details.organizer')}
                                </h3>
                                <div className="flex items-center gap-2 text-sm">
                                    <UserAvatar
                                        src={event.organizer.avatar}
                                        name={event.organizer.name}
                                        size="sm"
                                        rounded="full"
                                    />
                                    {event.organizer.name}
                                </div>
                                <p className="text-sm text-tertiary">
                                    {t('details.contact', {
                                        value: event.organizer.contact,
                                    })}
                                </p>
                                <Link
                                    to="/Manga-Reader/events"
                                    className="text-sm text-purple-400 underline"
                                >
                                    {t('details.otherEvents')}
                                </Link>
                            </div>

                            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                                <h3 className="font-semibold">
                                    {t('details.related')}
                                </h3>
                                {relatedEvents.map(item => (
                                    <Link
                                        key={item.id}
                                        to={`/Manga-Reader/event/${item.id}`}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-primary"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="object-cover w-12 h-12 rounded-lg"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {item.title}
                                            </p>
                                            <p className="inline-flex items-center gap-1 text-xs text-tertiary">
                                                <FiUsers /> {item.participants}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </aside>
                    </section>
                </article>
            </MainContent>
            <Footer />
        </>
    );
};

export default EventDetails;
