import { Check, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';

type MarkReleaseSeenButtonProps = {
    seen: boolean;
    onClick: () => void;
    loading?: boolean;
};

export const MarkReleaseSeenButton = ({ seen, onClick, loading }: MarkReleaseSeenButtonProps) => {
    const { t } = useTranslation('manga');
    return (
        <Button
            size="sm"
            variant="ghost"
            icon={Check}
            onClick={onClick}
            loading={loading}
            disabled={seen}
            aria-label={seen ? t('releases.alreadySeen') : t('releases.markSeen')}
        >
            {seen ? t('releases.seenBadge') : t('releases.markSeen')}
        </Button>
    );
};

export const MarkReleaseDaySeenButton = ({ onClick, loading }: Omit<MarkReleaseSeenButtonProps, 'seen'>) => {
    const { t } = useTranslation('manga');
    return (
        <Button size="sm" variant="ghost" icon={CheckCheck} onClick={onClick} loading={loading}>
            {t('releases.markAllSeen')}
        </Button>
    );
};
