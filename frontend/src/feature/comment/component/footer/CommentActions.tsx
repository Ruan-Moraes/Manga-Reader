import { AiFillDislike, AiFillLike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

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
    return (
        <div className="flex justify-between">
            <div className="flex gap-2">
                <BadgeIconButton onClick={onDislike} dislikeCount={dislikeCount}>
                    <AiFillDislike
                        size={13}
                        className={
                            userReaction === 'DISLIKE'
                                ? 'text-red-400'
                                : undefined
                        }
                    />
                </BadgeIconButton>
                <BadgeIconButton onClick={onLike} likeCount={likeCount}>
                    <AiFillLike
                        size={13}
                        className={
                            userReaction === 'LIKE'
                                ? 'text-green-400'
                                : undefined
                        }
                    />
                </BadgeIconButton>
            </div>
            <div className="flex gap-2">
                {isOwner && (
                    <>
                        <BadgeIconButton onClick={onDelete}>
                            <FaRegTrashAlt size={13} />
                        </BadgeIconButton>
                        <BadgeIconButton onClick={onEdit}>
                            <MdEdit size={13} />
                        </BadgeIconButton>
                    </>
                )}
                <DarkButton onClick={onReply} text="Responder" />
            </div>
        </div>
    );
};

export default CommentActions;
