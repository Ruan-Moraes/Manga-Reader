import { AiFillDislike, AiFillLike } from 'react-icons/ai';
import { FaRegTrashAlt } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';

import IconButton from '@shared/component/button/IconButton';
import BlackButton from '@shared/component/button/BlackButton';

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
                <IconButton onClick={() => {}} dislikeCount={dislikeCount}>
                    {/* // TODO: Implementar lógica de dislike */}
                    <AiFillDislike size={13} />
                </IconButton>
                <IconButton onClick={() => {}} likeCount={likeCount}>
                    {/* // TODO: Implementar lógica de like */}
                    <AiFillLike size={13} />
                </IconButton>
            </div>
            <div className="flex gap-2">
                {isOwner && (
                    <>
                        <IconButton onClick={onDelete}>
                            <FaRegTrashAlt size={13} />
                        </IconButton>
                        <IconButton onClick={onEdit}>
                            <MdEdit size={13} />
                        </IconButton>
                    </>
                )}
                <BlackButton text="Responder" onClick={onReply} />
            </div>
        </div>
    );
};

export default CommentActions;
