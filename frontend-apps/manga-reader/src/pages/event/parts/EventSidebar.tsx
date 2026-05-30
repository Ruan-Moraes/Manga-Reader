import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { ROUTES } from '@shared/constant/ROUTES';
import { Avatar } from '@ui/Avatar';
import type { EventData } from '@features/event';
import { Users } from 'lucide-react';

type EventSidebarProps = {
    event: EventData;
    relatedEvents: EventData[];
};

const EventSidebar = ({ event, relatedEvents }: EventSidebarProps) => {
    const { t } = useTranslation('event');

    return (
        <aside className="space-y-4">
            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h3 className="font-semibold">{t('details.tickets')}</h3>
                {(event.tickets ?? []).map(ticket => (
                    <div key={ticket.id} className="p-2 text-sm rounded-lg bg-primary">
                        <p className="font-medium">{ticket.name}</p>
                        <p>{ticket.price}</p>
                        <p className="text-tertiary">
                            {t('details.ticketSlots', {
                                count: ticket.available,
                            })}
                        </p>
                    </div>
                ))}
                <button type="button" className="w-full py-2 mt-2 font-medium text-purple-900 bg-white rounded-lg">
                    {t('details.register')}
                </button>
            </div>

            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h3 className="font-semibold">{t('details.organizer')}</h3>
                <div className="flex items-center gap-2 text-sm">
                    <Avatar src={event.organizer.avatar} name={event.organizer.name} size={32} shape="circle" />
                    {event.organizer.name}
                </div>
                <p className="text-sm text-tertiary">{t('details.contact', { value: event.organizer.contact })}</p>
                <Link to={`${WEB_BASE_URL}${ROUTES.EVENTS}`} className="text-sm text-purple-400 underline">
                    {t('details.otherEvents')}
                </Link>
            </div>

            <div className="p-4 space-y-2 border rounded-xl border-tertiary bg-secondary">
                <h3 className="font-semibold">{t('details.related')}</h3>
                {relatedEvents.map(item => (
                    <Link
                        key={item.id}
                        to={`${WEB_BASE_URL}${ROUTES.EVENT_DETAIL.replace(':eventId', item.id)}`}
                        className="flex items-center gap-2 p-2 rounded-lg bg-primary"
                    >
                        <img src={item.image} alt={item.title} className="object-cover w-12 h-12 rounded-lg" />
                        <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="inline-flex items-center gap-1 text-xs text-tertiary">
                                <Users /> {item.participants}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default EventSidebar;
