import { useTranslation } from 'react-i18next';
import { UserPlus } from 'lucide-react';

import type { ActivityEvent } from '../../model/activity.types';

const UserFollowedRow = ({ event }: { event: ActivityEvent }) => {
    const { t } = useTranslation('user');

    if (event.type !== 'USER_FOLLOWED') return null;

    const { targetType, targetName } = event.payload;
    const key = targetType === 'GROUP' ? 'profile.activity.groupFollowed' : 'profile.activity.userFollowed';

    return (
        <>
            <UserPlus className="size-4 shrink-0 text-mr-fg-subtle" aria-hidden="true" />
            <span className="flex-1 text-mr-small text-mr-fg-muted">{t(key, { name: targetName })}</span>
        </>
    );
};

export default UserFollowedRow;
