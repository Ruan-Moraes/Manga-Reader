import clsx from 'clsx';

import { type CommentData } from '../type/comment.types';
import { type User } from '@feature/auth';

import useCommentModals from '../hook/internal/useCommentModals';

import DeleteModal from './modal/delete-comment/DeleteModal';
import EditModal from './modal/edit-comment/EditModal';
import ReplyModal from './modal/reply-comment/ReplyModal';

import CommentMetadata from './header/CommentMetadata';
import CommentUser from './header/CommentUser';
import CommentContent from './body/CommentContent';
import CommentActions from './footer/CommentActions';

const Comment = ({
    onClickProfile,
    onClickEdit,
    onClickDelete,
    onClickReply,

    nestedLevel = 0,
    id,

    user,

    isOwner,
    isHighlighted,
    wasEdited,

    createdAt,

    textContent,
    imageContent,

    likeCount,
    dislikeCount,
}: { nestedLevel?: number } & {
    onClickProfile: (user: User) => void;
    onClickEdit: (
        id: string,
        newTextContent: string | null,
        newImageContent: string | null,
    ) => void;
    onClickDelete: (id: string) => void;
    onClickReply: (
        id: string,
        textContent: string | null,
        imageContent: string | null,
    ) => void;
} & CommentData) => {
    const {
        isDeleteModalOpen,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteComment,

        isEditModalOpen,
        openEditModal,
        closeEditModal,
        confirmEditComment,

        isReplyModalOpen,
        openReplyModal,
        closeReplyModal,
        confirmReplyComment,
    } = useCommentModals({
        onDelete: onClickDelete,
        onEdit: onClickEdit,
        onReply: onClickReply,
        commentId: id,
    });

    if (!textContent && !imageContent) {
        return null;
    }

    const userData: User = {
        id: user.id,
        name: user.name,
        photo: user.photo,
        bio: user.bio,
        moderator: user.moderator,
        member: user.member,
        socialMediasLinks: user.socialMediasLinks,
        statistics: user.statistics,
        recommendedTitles: user.recommendedTitles,
    };

    const getIndentationMargin = (level: number) => {
        if (level === 0) return 0;
        if (level === 1) return 8;

        return level * 8 + 8 * (level - 1);
    };

    const getBorderOffset = (index: number) => {
        if (index === 0) return -8;
        if (index === 1) return -24;

        return -(index * 8 + 8 * (index + 1));
    };

    return (
        <div
            style={{
                marginLeft: getIndentationMargin(nestedLevel) / 16 + 'rem',
            }}
            className={clsx({
                [`relative`]: nestedLevel > 0,
            })}
        >
            {nestedLevel > 0 &&
                Array.from({ length: nestedLevel }, (_, index) => (
                    <div
                        key={index}
                        className="absolute h-full border-l border-quaternary-opacity-25"
                        style={{
                            left: getBorderOffset(index) / 16 + 'rem',
                        }}
                    ></div>
                ))}
            {nestedLevel > 0 && (
                <div className="absolute w-[0.9375rem] border-t -left-[0.4453125rem] border-quaternary-opacity-25 top-6"></div>
            )}
            <div
                style={{
                    marginLeft: nestedLevel === 0 ? 0 : 0.5 + 'rem',
                }}
                className={clsx(
                    'flex flex-col gap-2 p-2 border rounded-xs rounded-bl-none border-tertiary mt-4',
                    {
                        'bg-secondary': !isHighlighted,
                        'bg-quaternary-opacity-25': isHighlighted,
                    },
                )}
            >
                <CommentMetadata createdAt={createdAt} wasEdited={wasEdited} />
                <CommentUser
                    onClickProfile={onClickProfile}
                    isHighlighted={isHighlighted}
                    user={userData}
                />
                <CommentContent
                    textContent={textContent}
                    imageContent={imageContent}
                    user={userData}
                />
                <CommentActions
                    onDelete={openDeleteModal}
                    onEdit={openEditModal}
                    onReply={openReplyModal}
                    isOwner={isOwner}
                    likeCount={likeCount}
                    dislikeCount={dislikeCount}
                />
            </div>
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onConfirm={confirmDeleteComment}
                onCancel={closeDeleteModal}
                title="Deletar comentário"
                message="Você tem certeza que deseja deletar este comentário? Essa ação deletará os comentários relacionados a ele."
            />
            <EditModal
                isOpen={isEditModalOpen}
                onEdit={confirmEditComment}
                onCancel={closeEditModal}
                title="Editar comentário"
                initialText={textContent}
                initialImages={imageContent}
            />
            <ReplyModal
                isOpen={isReplyModalOpen}
                onReply={confirmReplyComment}
                onCancel={closeReplyModal}
                title="Responder comentário"
            />
        </div>
    );
};

export default Comment;
