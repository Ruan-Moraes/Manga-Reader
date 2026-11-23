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
                className="shrink-0 cursor-pointer rounded-ui-xs p-1.5 text-ui-fg-subtle hover:bg-ui-secondary hover:text-ui-fg"
            >
                <EyeOff className="size-[15px]" aria-hidden="true" />
            </button>
        );
    }

    return (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <span className="text-ui-tiny text-ui-danger">
                {mutation.isError ? t('profile.activity.hideError') : t('profile.activity.hideConfirm')}
            </span>
            <button
                type="button"
                onClick={() => {
                    void mutation.mutateAsync(eventId).then(() => setConfirming(false)).catch(() => undefined);
                }}
                disabled={mutation.isPending}
                className="cursor-pointer rounded-ui-xs px-2 py-1 text-ui-small font-ui-bold text-ui-danger hover:bg-ui-danger-15 disabled:cursor-not-allowed disabled:opacity-ui-disabled"
            >
                {t('profile.activity.hideYes')}
            </button>
            <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={mutation.isPending}
                className="cursor-pointer rounded-ui-xs px-2 py-1 text-ui-small font-ui-bold text-ui-fg-subtle hover:bg-ui-secondary disabled:cursor-not-allowed disabled:opacity-ui-disabled"
            >
                {t('profile.activity.hideNo')}
            </button>
        </div>
    );
};

export default HideActivityEventAction;
