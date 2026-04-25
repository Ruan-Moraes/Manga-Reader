import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    FiCalendar,
    FiClock,
    FiMapPin,
    FiShare2,
    FiUsers,
} from 'react-icons/fi';

import { statusLabelKey, formatEventDate } from '../service/eventService';
import type { EventData } from '../type/event.types';

const EventCard = ({ event }: { event: EventData }) => {
    const { t } = useTranslation('event');

    return (
        <Link
            to={`/Manga-Reader/event/${event.id}`}
            className="overflow-hidden transition border group rounded-2xl border-tertiary bg-secondary hover:-translate-y-1 hover:shadow-xl hover:border-purple-400/70"
        >
            <img
                src={event.image}
                alt={event.title}
                className="object-cover w-full h-44"
            />
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                        {t(statusLabelKey[event.status])}
                    </span>
                    <button
                        type="button"
                        className="p-2 border rounded-full border-tertiary"
                        onClick={eventClick => eventClick.preventDefault()}
                    >
                        <FiShare2 />
                    </button>
                </div>
                <h3 className="text-lg font-bold">{event.title}</h3>
                <div className="space-y-1 text-sm text-tertiary">
                    <p className="flex items-center gap-2">
                        <FiClock /> {formatEventDate(event.startDate)}
                    </p>
                    <p className="flex items-center gap-2">
                        <FiMapPin /> {event.location.label}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 border rounded-full border-tertiary">
                        {event.type}
                    </span>
                    <span className="px-2 py-1 border rounded-full border-tertiary">
                        {event.priceLabel}
                    </span>
                </div>
                <p className="text-sm">
                    {t('card.organizer')}{' '}
                    <span className="font-medium text-purple-400">
                        {event.organizer.name}
                    </span>
                </p>
                <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-1">
                        <FiUsers />{' '}
                        {t('card.participantsCount', {
                            count: event.participants,
                        })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <FiCalendar /> {t('card.save')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={eventClick => eventClick.preventDefault()}
                    className="w-full px-3 py-2 mt-1 text-sm font-semibold text-purple-900 transition bg-white rounded-lg group-hover:bg-purple-200"
                >
                    {event.amIParticipating
                        ? t('card.confirmed')
                        : t('card.interested')}
                </button>
            </div>
        </Link>
    );
};

export default EventCard;
