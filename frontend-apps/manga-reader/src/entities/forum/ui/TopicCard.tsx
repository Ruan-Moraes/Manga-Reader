import { Link } from 'react-router-dom';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { useTranslation } from 'react-i18next';

const LANG_COLORS: Record<string, string> = {
    'pt-BR': 'bg-green-500/20 text-green-300',
    'en-US': 'bg-blue-500/20 text-blue-300',
    'es-ES': 'bg-yellow-500/20 text-yellow-300',
};
import { Avatar } from '@ui/Avatar';
import { Bookmark, CheckCircle, Eye, Heart, Lock, MessageCircle } from 'lucide-react';
import { formatRelativeDate, getCategoryColor, type ForumTopic } from '@entities/forum';

const TopicCard = ({ topic }: { topic: ForumTopic }) => {
    const { t } = useTranslation('forum');

    return (
        <Link
            to={`${WEB_BASE_URL}/forum/${topic.id}`}
            className="flex gap-4 p-4 transition-colors border rounded-lg border-tertiary bg-secondary hover:bg-tertiary/30"
        >
            {/* Avatar */}
            <Avatar src={topic.author.avatar} name={topic.author.name} size={40} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex flex-wrap items-center gap-2">
                    {topic.isPinned && <Bookmark className="text-yellow-400 shrink-0" size={14} />}
                    {topic.isLocked && <Lock className="text-red-400 shrink-0" size={14} />}
                    {topic.isSolved && <CheckCircle className="text-green-400 shrink-0" size={14} />}
                    <h3 className="text-sm font-semibold truncate text-shadow-default">{topic.title}</h3>
                    {topic.language && (
                        <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-mono rounded-xs ${LANG_COLORS[topic.language] ?? 'bg-tertiary/30 text-tertiary'}`}
                            title={`Posted in ${topic.language}`}
                        >
                            {topic.language}
                        </span>
                    )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-shadow-secondary">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(topic.category)}`}>{topic.category}</span>
                    <span>{t('topic.authoredBy', { name: topic.author.name })}</span>
                    <span>·</span>
                    <span>{formatRelativeDate(topic.createdAt)}</span>
                </div>

                {/* Tags */}
                {topic.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {topic.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-tertiary text-shadow-secondary">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Preview */}
                <p className="mt-2 text-xs line-clamp-2 text-shadow-secondary">{topic.content}</p>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-1 text-xs shrink-0 text-shadow-secondary">
                <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {topic.replyCount}
                </span>
                <span className="flex items-center gap-1">
                    <Eye size={12} /> {topic.viewCount}
                </span>
                <span className="flex items-center gap-1">
                    <Heart size={12} /> {topic.likeCount}
                </span>
            </div>
        </Link>
    );
};

export default TopicCard;
