import { useTranslation } from 'react-i18next';
import type { EventData } from '@entities/event';
import { Calendar, Clock, MapPin, Navigation } from 'lucide-react';

type EventBodyProps = {
    event: EventData;
};

const EventBody = ({ event }: EventBodyProps) => {
    const { t, i18n } = useTranslation('event');

    return (
        <div className="space-y-4 xl:col-span-2">
            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h2 className="text-xl font-semibold">{t('details.schedule')}</h2>
                <p className="inline-flex items-center gap-2 text-sm text-tertiary">
                    <Clock />{' '}
                    {t('details.startAt', {
                        date: new Date(event.startDate).toLocaleString(i18n.language),
                    })}
                </p>
                <p className="inline-flex items-center gap-2 ml-4 text-sm text-tertiary">
                    <Calendar />{' '}
                    {t('details.endAt', {
                        date: new Date(event.endDate).toLocaleString(i18n.language),
                    })}
                </p>
                <p className="text-sm text-tertiary">{t('details.timezone', { timezone: event.timezone })}</p>
                <ul className="pl-5 text-sm list-disc">
                    {event.schedule.map(item => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </div>

            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h2 className="text-xl font-semibold">{t('details.location')}</h2>
                <p className="inline-flex items-center gap-2 text-sm">
                    <MapPin /> {event.location.address} - {event.location.city}
                </p>
                <div className="p-4 text-sm border border-dashed rounded-lg border-tertiary">{t('details.mapMock')}</div>
                <div className="flex gap-3 text-sm">
                    <a href={event.location.mapLink} className="text-purple-400 underline">
                        {t('details.openMaps')}
                    </a>
                    <a href={event.location.mapLink} className="text-purple-400 underline">
                        {t('details.openWaze')}
                    </a>
                </div>
                <p className="text-sm text-tertiary">
                    <Navigation className="inline mr-1" />
                    {event.location.directions}
                </p>
            </div>

            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                <h2 className="text-xl font-semibold">{t('details.description')}</h2>
                <p>{event.description}</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {event.gallery.map(image => (
                        <img key={image} src={image} alt={t('details.galleryAlt')} className="object-cover w-full rounded-lg h-36" />
                    ))}
                </div>
                <p className="text-sm">
                    <strong>{t('details.guests')}</strong> {event.specialGuests.join(', ')}
                </p>
            </div>

            <div className="p-4 space-y-3 border rounded-xl border-tertiary bg-secondary">
                <h2 className="text-xl font-semibold">{t('details.comments')}</h2>
                {event.comments.map(comment => (
                    <div key={comment.id} className="p-3 text-sm rounded-lg bg-primary">
                        <p className="font-semibold">{comment.user}</p>
                        <p>{comment.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventBody;
