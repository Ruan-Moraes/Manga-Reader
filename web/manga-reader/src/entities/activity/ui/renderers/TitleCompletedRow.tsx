import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';

import type { ActivityEvent } from '../../model/activity.types';

const TitleCompletedRow = ({ event }: { event: ActivityEvent }) => {
    const { t } = useTranslation('user');

    if (event.type !== 'TITLE_COMPLETED') return null;

    const { titleName } = event.payload;

    return (
        <>
            <CheckCircle2 className="size-4 shrink-0 text-mr-fg-subtle" aria-hidden="true" />
            <span className="flex-1 text-mr-small text-mr-fg-muted">
                {t('profile.activity.titleCompleted', { title: titleName })}
            </span>
        </>
    );
};

export default TitleCompletedRow;
