import { useTranslation } from 'react-i18next';

type EventFormActionsProps = {
    asDraft: boolean;
    toggleDraft: () => void;
    onCancel: () => void;
};

const EventFormActions = ({ asDraft, toggleDraft, onCancel }: EventFormActionsProps) => {
    const { t } = useTranslation('event');

    return (
        <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button type="submit" className="px-4 py-2 text-white bg-purple-600 rounded-lg">
                {t('form.actions.submit')}
            </button>
            <button type="button" onClick={toggleDraft} className="px-4 py-2 border rounded-lg border-tertiary">
                {asDraft ? t('form.actions.draftSaved') : t('form.actions.saveDraft')}
            </button>
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg border-tertiary">
                {t('form.actions.cancel')}
            </button>
        </div>
    );
};

export default EventFormActions;
