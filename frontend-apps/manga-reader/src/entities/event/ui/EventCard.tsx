import { memo } from 'react';

import { cn } from '@shared/lib/cn';

import { Button } from '@ui/Button';
import { Badge } from '@ui/Badge';
import { Avatar } from '@ui/Avatar';

export interface EventCardProps {
    event: {
        id: string;
        title: string;
        type: 'launch' | 'meetup' | 'stream' | 'announcement';
        when: string;
        location?: string;
        coverImage?: string;
        coverGradient?: string;
        organizer?: { name: string; avatar?: string };
        attendees?: number;
        going?: boolean;
        special?: boolean;
        past?: boolean;
    };
    onClick?: () => void;
    onToggleGoing?: () => void;
}

const typeBadge = {
    launch: { variant: 'accent' as const, label: 'Lançamento' },
    meetup: { variant: 'neutral' as const, label: 'Encontro' },
    stream: { variant: 'danger' as const, label: 'Ao vivo' },
    announcement: { variant: 'neutral' as const, label: 'Anúncio' },
};

const EventCardBase = ({ event, onClick, onToggleGoing }: EventCardProps) => {
    const t = typeBadge[event.type];

    if (event.special) {
        return (
            <article
                onClick={onClick}
                className={cn(
                    'group flex cursor-pointer flex-col overflow-hidden rounded-mr-md border border-mr-border bg-mr-surface transition-all duration-mr-default',
                    'hover:-translate-y-0.5 hover:border-mr-accent-50',
                    event.past && 'opacity-55',
                )}
            >
                <div
                    className="relative h-44"
                    style={{
                        background: event.coverGradient ?? 'linear-gradient(135deg, #2a1f3a, #161616)',
                    }}
                >
                    {event.coverImage && <img src={event.coverImage} alt="" className="size-full object-cover" />}
                    <div className="absolute left-3 top-3">
                        <Badge variant={t.variant}>{t.label}</Badge>
                    </div>
                </div>
                <div className="flex flex-col gap-3 p-4">
                    <h3 className="text-mr-h3 font-mr-extrabold leading-tight tracking-mr text-mr-fg">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-mr-tiny text-mr-fg-subtle">
                        <span className="font-mr-bold uppercase tracking-[0.08em] text-mr-fg">{event.when}</span>
                        {event.location && (
                            <>
                                <span>·</span>
                                <span>{event.location}</span>
                            </>
                        )}
                    </div>
                    {event.organizer && (
                        <div className="flex items-center gap-2 text-mr-tiny text-mr-fg-muted">
                            <Avatar src={event.organizer.avatar} name={event.organizer.name} size={24} />
                            <span>{event.organizer.name}</span>
                            {event.attendees != null && <span>· {event.attendees} confirmados</span>}
                        </div>
                    )}
                    {!event.past && onToggleGoing && (
                        <Button
                            variant={event.going ? 'ghost' : 'primary'}
                            aria-pressed={event.going}
                            onClick={e => {
                                e.stopPropagation();
                                onToggleGoing();
                            }}
                        >
                            {event.going ? 'Vou comparecer' : 'Tenho interesse'}
                        </Button>
                    )}
                    {event.past && <div className="mr-label text-mr-fg-subtle">Encerrado</div>}
                </div>
            </article>
        );
    }

    return (
        <article
            onClick={onClick}
            className="group flex cursor-pointer gap-3 rounded-mr-md border border-mr-border bg-mr-surface p-4 transition-all hover:-translate-y-0.5 hover:border-mr-accent-50"
        >
            <div
                className="size-20 shrink-0 overflow-hidden rounded-mr-sm"
                style={{
                    background: event.coverGradient ?? 'linear-gradient(135deg, #2a1f3a, #161616)',
                }}
            >
                {event.coverImage && <img src={event.coverImage} alt="" className="size-full object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Badge variant={t.variant}>{t.label}</Badge>
                <h3 className="truncate text-mr-h4 font-mr-extrabold tracking-mr text-mr-fg">{event.title}</h3>
                <div className="flex flex-wrap gap-2 text-mr-tiny text-mr-fg-subtle">
                    <span className="font-mr-bold text-mr-fg">{event.when}</span>
                    {event.location && <span>· {event.location}</span>}
                    {event.attendees != null && <span>· {event.attendees} indo</span>}
                </div>
            </div>
        </article>
    );
};

export const EventCard = memo(EventCardBase);

export default EventCard;
