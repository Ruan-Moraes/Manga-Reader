import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { EyeOff } from 'lucide-react';

import { formatPostDate } from '@shared/service/util/formatPostDate';

import { Avatar } from '@ui/Avatar';

import type { ActivityEvent } from '../model/activity.types';
import { ACTIVITY_ROW_RENDERERS } from './renderers/registry';

type ActivityEventRowProps = {
    event: ActivityEvent;
    onHide: () => void;
    hiding?: boolean;
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

const ActivityEventRow = ({ event, onHide, hiding }: ActivityEventRowProps) => {
    const { t } = useTranslation('user');
    const [confirmingHide, setConfirmingHide] = useState(false);

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

            {confirmingHide ? (
                <div className="flex shrink-0 items-center gap-1">
                    <span className="text-mr-tiny text-mr-danger">{t('profile.activity.hideConfirm')}</span>
                    <button
                        type="button"
                        onClick={() => {
                            onHide();
                            setConfirmingHide(false);
                        }}
                        disabled={hiding}
                        className="rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-danger hover:bg-mr-danger-15 cursor-pointer"
                    >
                        {t('profile.activity.hideYes')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmingHide(false)}
                        className="rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-fg-subtle hover:bg-mr-secondary cursor-pointer"
                    >
                        {t('profile.activity.hideNo')}
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setConfirmingHide(true)}
                    aria-label={t('profile.activity.hide')}
                    className="shrink-0 rounded-mr-xs p-1.5 text-mr-fg-subtle hover:bg-mr-secondary hover:text-mr-fg cursor-pointer"
                >
                    <EyeOff className="size-[15px]" aria-hidden="true" />
                </button>
            )}
        </div>
    );
};

export default ActivityEventRow;
