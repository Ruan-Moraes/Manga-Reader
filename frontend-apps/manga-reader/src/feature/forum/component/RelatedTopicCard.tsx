import { Link } from 'react-router-dom';

import { formatRelativeDate, type ForumTopic } from '@feature/forum';

const RelatedTopicCard = ({ topic }: { topic: ForumTopic }) => (
    <Link
        to={`/Manga-Reader/forum/${topic.id}`}
        className="block p-3 transition-colors border rounded-lg border-tertiary hover:bg-tertiary/30"
    >
        <h4 className="text-xs font-semibold truncate text-shadow-default">
            {topic.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-[10px] text-shadow-secondary">
            <span>{topic.replyCount} respostas</span>
            <span>·</span>
            <span>{formatRelativeDate(topic.lastActivityAt)}</span>
        </div>
    </Link>
);

export default RelatedTopicCard;
