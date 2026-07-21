import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeOff } from 'lucide-react';

import useHideActivityEvent from '../model/useHideActivityEvent';

type HideActivityEventActionProps = {
    eventId: string;
};

const HideActivityEventAction = ({ eventId }: HideActivityEventActionProps) => {
    const { t } = useTranslation('user');
    const [confirming, setConfirming] = useState(false);
    const mutation = useHideActivityEvent();

    if (!confirming) {
        return (
            <button
                type="button"
                onClick={() => {
                    mutation.reset();
                    setConfirming(true);
                }}
                aria-label={t('profile.activity.hide')}
                className="shrink-0 cursor-pointer rounded-mr-xs p-1.5 text-mr-fg-subtle hover:bg-mr-secondary hover:text-mr-fg"
            >
                <EyeOff className="size-[15px]" aria-hidden="true" />
            </button>
        );
    }

    return (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <span className="text-mr-tiny text-mr-danger">
                {mutation.isError ? t('profile.activity.hideError') : t('profile.activity.hideConfirm')}
            </span>
            <button
                type="button"
                onClick={() => {
                    void mutation.mutateAsync(eventId).then(() => setConfirming(false)).catch(() => undefined);
                }}
                disabled={mutation.isPending}
                className="cursor-pointer rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-danger hover:bg-mr-danger-15 disabled:cursor-not-allowed disabled:opacity-mr-disabled"
            >
                {t('profile.activity.hideYes')}
            </button>
            <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={mutation.isPending}
                className="cursor-pointer rounded-mr-xs px-2 py-1 text-mr-small font-mr-bold text-mr-fg-subtle hover:bg-mr-secondary disabled:cursor-not-allowed disabled:opacity-mr-disabled"
            >
                {t('profile.activity.hideNo')}
            </button>
        </div>
    );
};

export default HideActivityEventAction;
