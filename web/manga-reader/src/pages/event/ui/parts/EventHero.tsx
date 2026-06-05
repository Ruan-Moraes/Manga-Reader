import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@ui/Avatar';
import { statusLabelKey, type EventData } from '@entities/event';

type EventHeroProps = {
    event: EventData;
};

const EventHero = ({ event }: EventHeroProps) => {
    const { t } = useTranslation('event');

    return (
        <section className="overflow-hidden border rounded-2xl border-tertiary bg-secondary">
            <img src={event.image} alt={event.title} className="object-cover w-full h-72" />
            <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">{t(statusLabelKey[event.status])}</span>
                    <span className="px-2 py-1 text-xs border rounded-full border-tertiary">{event.type}</span>
                </div>
                <h1 className="text-3xl font-bold">{event.title}</h1>
                <div className="flex items-center gap-3">
                    <Avatar src={event.organizer.avatar} name={event.organizer.name} />
                    <Link to={event.organizer.profileLink} className="font-medium text-purple-400">
                        {event.organizer.name}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default EventHero;
