import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { formatPostDate } from '@shared/service/util/formatPostDate';

import { Avatar } from '@ui/Avatar';

import type { ActivityEvent } from '../model/activity.types';
import { ACTIVITY_ROW_RENDERERS } from './renderers/registry';

type ActivityEventRowProps = {
    event: ActivityEvent;
    actions?: ReactNode;
};

/** Capa/avatar + link de destino — a única parte que precisa saber de todos os tipos (metadado de layout, não regra de negócio). */
const getCoverAndHref = (event: ActivityEvent): { cover?: string; name: string; href?: string } => {
    switch (event.type) {
        case 'CHAPTER_READ':
            return {
                cover: event.payload.titleCover,
                name: event.payload.titleName,
                href: `/title/${event.payload.titleId}/chapter/${event.payload.chapterNumber}`,
            };
        case 'REVIEW_POSTED':
            return { cover: event.payload.titleCover, name: event.payload.titleName, href: `/title/${event.payload.titleId}` };
        case 'TITLE_COMPLETED':
            return { cover: event.payload.titleCover, name: event.payload.titleName, href: `/title/${event.payload.titleId}` };
        case 'USER_FOLLOWED':
            return {
                cover: event.payload.targetAvatar,
                name: event.payload.targetName,
                href: event.payload.targetType === 'GROUP' ? `/groups/${event.payload.targetId}` : `/users/${event.payload.targetId}`,
            };
    }
};

const ActivityEventRow = ({ event, actions }: ActivityEventRowProps) => {
    const Renderer = ACTIVITY_ROW_RENDERERS[event.type];
    const { cover, name, href } = getCoverAndHref(event);
    const { label: when, title: whenTitle } = formatPostDate(event.occurredAt);

    return (
        <div className="flex items-center gap-3 rounded-mr-xs border border-mr-border bg-mr-surface px-4 py-3">
            {href ? (
                <Link to={href} className="shrink-0">
                    <Avatar src={cover} name={name} size={32} />
                </Link>
            ) : (
                <Avatar src={cover} name={name} size={32} />
            )}

            <Renderer event={event} />

            <span className="shrink-0 text-mr-tiny text-mr-fg-subtle" title={whenTitle}>
                {when}
            </span>

            {actions}
        </div>
    );
};

export default ActivityEventRow;
