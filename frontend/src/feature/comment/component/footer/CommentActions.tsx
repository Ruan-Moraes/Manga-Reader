import { AiFillDislike, AiFillLike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

import BadgeIconButton from '@shared/component/button/BadgeIconButton';
import DarkButton from '@shared/component/button/DarkButton';

type CommentActionsProps = {
    onDelete: () => void;
    onEdit: () => void;
    onReply: () => void;

    isOwner: boolean;

    dislikeCount: string;
    likeCount: string;
};

const CommentActions = ({
    onDelete,
    onEdit,
    onReply,

    isOwner,

    dislikeCount,
    likeCount,
}: CommentActionsProps) => {
    return (
        <div className="flex justify-between">
            <div className="flex gap-2">
                <BadgeIconButton onClick={() => {}} dislikeCount={dislikeCount}>
                    {/* // TODO: Implementar lógica de dislike */}
                    <AiFillDislike size={13} />
                </BadgeIconButton>
                <BadgeIconButton onClick={() => {}} likeCount={likeCount}>
                    {/* // TODO: Implementar lógica de like */}
                    <AiFillLike size={13} />
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
