import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';

import type { ActivityEvent } from '../../model/activity.types';

const ReviewPostedRow = ({ event }: { event: ActivityEvent }) => {
    const { t } = useTranslation('user');

    if (event.type !== 'REVIEW_POSTED') return null;

    const { titleName } = event.payload;

    return (
        <>
            <Star className="size-4 shrink-0 text-mr-fg-subtle" aria-hidden="true" />
            <span className="flex-1 text-mr-small text-mr-fg-muted">
                {t('profile.activity.reviewPosted', { title: titleName })}
            </span>
        </>
    );
};

export default ReviewPostedRow;
