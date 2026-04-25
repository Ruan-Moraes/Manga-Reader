import { FiCheckCircle, FiThumbsUp, FiMessageCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import UserAvatar from '@shared/component/avatar/UserAvatar';
import {
    formatRelativeDate,
    roleBadgeColor,
    roleLabelKey,
    type ForumReply,
} from '@feature/forum';

const ReplyCard = ({ reply }: { reply: ForumReply }) => {
    const { t } = useTranslation('forum');

    return (
        <div className="flex gap-3 p-4 border rounded-lg border-tertiary bg-secondary">
            <UserAvatar
                src={reply.author.avatar}
                name={reply.author.name}
                size="sm"
                rounded="full"
            />
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-shadow-default">
                        {reply.author.name}
                    </span>
                    <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${roleBadgeColor[reply.author.role]}`}
                    >
                        {t(roleLabelKey[reply.author.role])}
                    </span>
                    <span className="text-shadow-secondary">
                        {formatRelativeDate(reply.createdAt)}
                    </span>
                    {reply.isEdited && (
                        <span className="italic text-shadow-secondary">
                            {t('reply.edited')}
                        </span>
                    )}
                    {reply.isBestAnswer && (
                        <span className="flex items-center gap-1 text-green-400">
                            <FiCheckCircle size={12} /> {t('reply.bestAnswer')}
                        </span>
                    )}
                </div>
                <p className="mt-2 text-sm text-shadow-default">
                    {reply.content}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-shadow-secondary">
                    <button className="flex items-center gap-1 transition-colors hover:text-quaternary-default">
                        <FiThumbsUp size={12} /> {reply.likes}
                    </button>
                    <button className="flex items-center gap-1 transition-colors hover:text-quaternary-default">
                        <FiMessageCircle size={12} /> {t('reply.reply')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReplyCard;
