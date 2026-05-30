import { Link } from 'react-router-dom';
import { WEB_BASE_URL } from '@shared/constant/baseUrl';
import { useTranslation } from 'react-i18next';

import { formatRelativeDate, type ForumTopic } from '@entities/forum';

const RelatedTopicCard = ({ topic }: { topic: ForumTopic }) => {
    const { t } = useTranslation('forum');

    return (
        <Link to={`${WEB_BASE_URL}/forum/${topic.id}`} className="block p-3 transition-colors border rounded-lg border-tertiary hover:bg-tertiary/30">
            <h4 className="text-xs font-semibold truncate text-shadow-default">{topic.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-shadow-secondary">
                <span>{t('topic.replies', { count: topic.replyCount })}</span>
                <span>·</span>
                <span>{formatRelativeDate(topic.lastActivityAt)}</span>
            </div>
        </Link>
    );
};

export default RelatedTopicCard;
