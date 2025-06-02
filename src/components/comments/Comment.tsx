import clsx from 'clsx';

import { CommentTypes } from '../../types/CommentTypes';
import { UserTypes } from '../../types/UserTypes';

import useCommentModal from '../../hooks/comments/internal/useCommentModal';

import DeleteModal from '../modals/no-context/delete-comment/DeleteModal';
import EditModal from '../modals/no-context/edit-comment/EditModal';

import CommentInformation from './header/CommentInformation';
import CommentUser from './header/CommentUser';
import CommentContent from './body/CommentContent';
import CommentActions from './footer/CommentActions';

const Comment = ({
    onClickProfile,
    onClickEdit,
    onClickDelete,

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
    onClickProfile: (user: UserTypes) => void;
    onClickEdit: (
        id: string,
        newTextContent?: string,
        newImageContent?: string,
    ) => void;
    onClickDelete: (id: string) => void;
} & CommentTypes) => {
    const {
        isDeleteModalOpen,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteComment,

        isEditModalOpen,
        openEditModal,
        closeEditModal,
        confirmEditComment,
    } = useCommentModal({
        onDelete: onClickDelete,
        onEdit: onClickEdit,
        commentId: id,
    });

    if (!textContent && !imageContent) {
        return null;
    }

    const userData: UserTypes = {
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
                <CommentInformation
                    createdAt={createdAt}
                    wasEdited={wasEdited}
                />
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
        </div>
    );
};

export default Comment;
