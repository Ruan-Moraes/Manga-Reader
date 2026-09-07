import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';

type EventFormActionsProps = {
    asDraft: boolean;
    toggleDraft: () => void;
    onCancel: () => void;
};

const EventFormActions = ({ asDraft, toggleDraft, onCancel }: EventFormActionsProps) => {
    const { t } = useTranslation('event');

    return (
        <div className="flex flex-wrap gap-2 lg:col-span-2">
            <Button type="submit" variant="primary">
                {t('form.actions.submit')}
            </Button>
            <Button type="button" variant="raised" onClick={toggleDraft}>
                {asDraft ? t('form.actions.draftSaved') : t('form.actions.saveDraft')}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
                {t('form.actions.cancel')}
            </Button>
        </div>
    );
};

export default EventFormActions;
