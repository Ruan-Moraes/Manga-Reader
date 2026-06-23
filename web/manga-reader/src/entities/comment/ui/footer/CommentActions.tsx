import { useTranslation } from 'react-i18next';

import { Pencil, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';

import { IconButton } from '@ui/IconButton';
import { Button } from '@ui/Button';

type CommentActionsProps = {
    onDelete: () => void;
    onEdit: () => void;
    onReply: () => void;
    onLike: () => void;
    onDislike: () => void;

    isOwner: boolean;

    dislikeCount: string;
    likeCount: string;

    userReaction?: 'LIKE' | 'DISLIKE' | null;
};

const CommentActions = ({
    onDelete,
    onEdit,
    onReply,
    onLike,
    onDislike,

    isOwner,

    dislikeCount,
    likeCount,

    userReaction,
}: CommentActionsProps) => {
    const { t } = useTranslation('comment');

    return (
        <div className="flex justify-between">
            <div className="flex gap-2">
                <div className="relative">
                    <IconButton
                        icon={ThumbsDown}
                        aria-label={t('actions.dislike')}
                        size="sm"
                        variant="ghost"
                        onClick={onDislike}
                        className={userReaction === 'DISLIKE' ? 'text-red-400' : undefined}
                    />
                    {Number(dislikeCount) > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center text-[0.5rem] font-bold text-white bg-red-500 rounded-full border border-tertiary p-0.5 min-w-[1rem]">
                            {Number(dislikeCount) < 10 ? dislikeCount.padStart(2, '0') : dislikeCount}
                        </span>
                    )}
                </div>
                <div className="relative">
                    <IconButton
                        icon={ThumbsUp}
                        aria-label={t('actions.like')}
                        size="sm"
                        variant="ghost"
                        onClick={onLike}
                        className={userReaction === 'LIKE' ? 'text-green-400' : undefined}
                    />
                    {Number(likeCount) > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center text-[0.5rem] font-bold text-white bg-green-500 rounded-full border border-tertiary p-0.5 min-w-[1rem]">
                            {Number(likeCount) < 10 ? likeCount.padStart(2, '0') : likeCount}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                {isOwner && (
                    <>
                        <IconButton icon={Trash2} aria-label={t('actions.delete')} size="sm" variant="ghost" onClick={onDelete} />
                        <IconButton icon={Pencil} aria-label={t('actions.edit')} size="sm" variant="ghost" onClick={onEdit} />
                    </>
                )}
                <Button variant="ghost" size="sm" onClick={onReply}>
                    {t('actions.reply')}
                </Button>
            </div>
        </div>
    );
};

export default CommentActions;
