import { useTranslation } from 'react-i18next';
import { Avatar } from '@ui/Avatar';
import { EmptyState } from '@ui/EmptyState';

type ActivityItem = { text: string; when: string };

type ActivityTabProps = {
    activity: ActivityItem[];
    profileName: string;
};

const ActivityTab = ({ activity, profileName }: ActivityTabProps) => {
    const { t } = useTranslation('user');

    if (activity.length === 0) {
        return <EmptyState illustration="surpresa" title={t('profile.noActivity')} />;
    }

    return (
        <div className="flex flex-col gap-2">
            {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-mr-md border border-mr-border bg-mr-surface px-4 py-3">
                    <Avatar name={profileName} size={32} />
                    <p className="flex-1 text-mr-small text-mr-fg-muted">{a.text}</p>
                    <span className="shrink-0 text-mr-tiny text-mr-fg-subtle">{a.when}</span>
                </div>
            ))}
        </div>
    );
};

export default ActivityTab;
