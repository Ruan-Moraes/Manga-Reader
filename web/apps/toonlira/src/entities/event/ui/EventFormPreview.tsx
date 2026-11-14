import { useTranslation } from 'react-i18next';

import type { DraftEvent } from '../model/useEventForm';

type EventFormPreviewProps = {
    draftEvent: Pick<DraftEvent, 'title' | 'description' | 'startDate'>;
};

const EventFormPreview = ({ draftEvent }: EventFormPreviewProps) => {
    const { t, i18n } = useTranslation('event');

    return (
        <div className="p-4 text-sm border rounded-lg border-tertiary bg-primary">
            <p className="mb-2 font-semibold">{t('form.preview.title')}</p>
            <p className="font-medium">{draftEvent.title || t('form.preview.placeholderTitle')}</p>
            <p>{draftEvent.description || t('form.preview.placeholderDescription')}</p>
            <p className="mt-1 text-tertiary">
                {draftEvent.startDate
                    ? t('form.preview.startAt', {
                          date: new Date(draftEvent.startDate).toLocaleString(i18n.language),
                      })
                    : t('form.preview.pickDateTime')}
            </p>
        </div>
    );
};

export default EventFormPreview;
