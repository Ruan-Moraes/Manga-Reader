import { Link } from 'react-router-dom';
import {
    FiEye,
    FiHeart,
    FiMessageCircle,
    FiCheckCircle,
    FiLock,
    FiBookmark,
} from 'react-icons/fi';

import {
    formatRelativeDate,
    getCategoryColor,
    type ForumTopic,
} from '@feature/forum';

const TopicCard = ({ topic }: { topic: ForumTopic }) => (
    <Link
        to={`/Manga-Reader/forum/${topic.id}`}
        className="flex gap-4 p-4 transition-colors border rounded-lg border-tertiary bg-secondary hover:bg-tertiary/30"
    >
        {/* Avatar */}
        <img
            src={topic.author.avatar}
            alt={topic.author.name}
            className="object-cover w-10 h-10 rounded-full shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2">
                {topic.isPinned && (
                    <FiBookmark
                        className="text-yellow-400 shrink-0"
                        size={14}
                    />
                )}
                {topic.isLocked && (
                    <FiLock className="text-red-400 shrink-0" size={14} />
                )}
                {topic.isSolved && (
                    <FiCheckCircle
                        className="text-green-400 shrink-0"
                        size={14}
                    />
                )}
                <h3 className="text-sm font-semibold truncate text-shadow-default">
                    {topic.title}
                </h3>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-shadow-secondary">
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(topic.category)}`}
                >
                    {topic.category}
                </span>
                <span>por {topic.author.name}</span>
                <span>·</span>
                <span>{formatRelativeDate(topic.createdAt)}</span>
            </div>

            {/* Tags */}
            {topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {topic.tags.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] rounded bg-tertiary text-shadow-secondary"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Preview */}
            <p className="mt-2 text-xs line-clamp-2 text-shadow-secondary">
                {topic.content}
            </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 text-xs shrink-0 text-shadow-secondary">
            <span className="flex items-center gap-1">
                <FiMessageCircle size={12} /> {topic.replyCount}
            </span>
            <span className="flex items-center gap-1">
                <FiEye size={12} /> {topic.viewCount}
            </span>
            <span className="flex items-center gap-1">
                <FiHeart size={12} /> {topic.likeCount}
            </span>
        </div>
    </Link>
);

export default TopicCard;
