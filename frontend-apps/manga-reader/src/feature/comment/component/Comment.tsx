import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { requireAuth } from '@shared/service/util/requireAuth';
import { type User } from '@feature/user';

import useCommentModals from '../hook/internal/useCommentModals';
import useCommentScrollToParent from '../hook/internal/useCommentScrollToParent';

import { type CommentProps } from '../type/comment.types';

import DeleteModal from './modal/delete-comment/DeleteModal';
import EditModal from './modal/edit-comment/EditModal';
import InlineReplyInput from './InlineReplyInput';
import CommentMetadata from './header/CommentMetadata';
import CommentUser from './header/CommentUser';
import CommentContent from './body/CommentContent';
import CommentActions from './footer/CommentActions';

const MAX_VISUAL_DEPTH = 5;

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

const Comment = ({
    onClickProfile,
    onClickEdit,
    onClickDelete,
    onClickReply,
    onLike,
    onDislike,
    titleId,
    nestedLevel = 0,
    parentUserName = null,
    id,
    parentCommentId,
    user,
    isOwner,
    isHighlighted,
    wasEdited,
    createdAt,
    textContent,
    imageContent,
    likeCount,
    dislikeCount,
    userReaction,
}: CommentProps) => {
    const { t } = useTranslation('comment');
    const [isReplying, setIsReplying] = useState(false);

    const scrollToParent = useCommentScrollToParent(parentCommentId);

    const { isDeleteModalOpen, openDeleteModal, closeDeleteModal, confirmDeleteComment, isEditModalOpen, openEditModal, closeEditModal, confirmEditComment } =
        useCommentModals({
            onDelete: onClickDelete,
            onEdit: onClickEdit,
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

    const isDeepNested = nestedLevel > MAX_VISUAL_DEPTH;
    const visualLevel = isDeepNested ? 0 : nestedLevel;

    const handleReplySubmit = (replyText: string | null, replyImage: string | null) => {
        onClickReply(id, titleId, replyText, replyImage);
        setIsReplying(false);
    };

    return (
        <div
            id={`comment-${id}`}
            style={{
                marginLeft: getIndentationMargin(visualLevel) / 16 + 'rem',
            }}
            className={clsx({ [`relative`]: visualLevel > 0 })}
        >
            {visualLevel > 0 &&
                Array.from({ length: visualLevel }, (_, index) => (
                    <div
                        key={index}
                        className="absolute h-full border-l border-quaternary-opacity-25"
                        style={{
                            left: getBorderOffset(index) / 16 + 'rem',
                        }}
                    />
                ))}
            {visualLevel > 0 && <div className="absolute w-[0.9375rem] border-t -left-[0.4453125rem] border-quaternary-opacity-25 top-6" />}
            <div
                style={{
                    marginLeft: visualLevel === 0 ? 0 : 0.5 + 'rem',
                }}
                className={clsx('comment-card flex flex-col gap-2 p-2 border rounded-xs rounded-bl-none border-tertiary mt-4', {
                    'bg-secondary': !isHighlighted,
                    'bg-quaternary-opacity-25': isHighlighted,
                })}
            >
                {isDeepNested && parentUserName && (
                    <button
                        type="button"
                        onClick={scrollToParent}
                        className="self-start text-xs text-tertiary hover:text-quaternary-default transition-colors cursor-pointer"
                    >
                        {t('reply.replyingTo')} <span className="font-semibold text-quaternary-default">{parentUserName}</span>
                    </button>
                )}
                <CommentMetadata createdAt={createdAt} wasEdited={wasEdited} />
                <CommentUser onClickProfile={onClickProfile} isHighlighted={isHighlighted} user={userData} />
                <CommentContent textContent={textContent} imageContent={imageContent} user={userData} />
                <CommentActions
                    onDelete={openDeleteModal}
                    onEdit={openEditModal}
                    onReply={() => {
                        if (!requireAuth(t('reply.authAction'))) return;
                        setIsReplying(true);
                    }}
                    onLike={() => onLike(id)}
                    onDislike={() => onDislike(id)}
                    isOwner={isOwner}
                    likeCount={likeCount}
                    dislikeCount={dislikeCount}
                    userReaction={userReaction}
                />
            </div>
            {isReplying && <InlineReplyInput onSubmit={handleReplySubmit} onCancel={() => setIsReplying(false)} />}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                onConfirm={confirmDeleteComment}
                onCancel={closeDeleteModal}
                title={t('delete.title')}
                message={t('delete.message')}
            />
            <EditModal
                isOpen={isEditModalOpen}
                onEdit={confirmEditComment}
                onCancel={closeEditModal}
                title={t('edit.title')}
                initialText={textContent}
                initialImages={imageContent}
            />
        </div>
    );
};

export default Comment;
