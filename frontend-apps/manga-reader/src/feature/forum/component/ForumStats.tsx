import { useTranslation } from 'react-i18next';

import type { ForumTopic } from '@feature/forum';

const ForumStats = ({ topics }: { topics: ForumTopic[] }) => {
    const { t, i18n } = useTranslation('forum');
    const totalReplies = topics.reduce((s, t) => s + t.replyCount, 0);
    const totalViews = topics.reduce((s, t) => s + t.viewCount, 0);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
                { label: t('stats.topics'), value: topics.length },
                { label: t('stats.replies'), value: totalReplies },
                { label: t('stats.views'), value: totalViews },
                {
                    label: t('stats.activeMembers'),
                    value: new Set(topics.map(topic => topic.author.id)).size,
                },
            ].map(({ label, value }) => (
                <div
                    key={label}
                    className="p-3 text-center border rounded-lg bg-secondary border-tertiary"
                >
                    <p className="text-lg font-bold text-quaternary-default">
                        {value.toLocaleString(i18n.language)}
                    </p>
                    <p className="text-xs text-shadow-secondary">{label}</p>
                </div>
            ))}
        </div>
    );
};

export default ForumStats;
