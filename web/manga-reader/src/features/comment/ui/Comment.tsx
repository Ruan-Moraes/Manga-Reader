import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';

import { requireAuth } from '@shared/service/util/requireAuth';
import formatRelativeDate from '@shared/service/util/formatRelativeDate';
import { useMediaQuery } from '@shared/lib/useMediaQuery';
import { type User } from '@entities/user';

import { PostShell } from '@ui/PostShell';
import { PostHeader } from '@ui/PostHeader';
import { VotePill } from '@ui/VotePill';
import { ActionBar } from '@ui/ActionBar';
import { IconButton } from '@ui/IconButton';

import useCommentModals from '../model/internal/useCommentModals';
import useCommentScrollToParent from '../model/internal/useCommentScrollToParent';

import { type CommentProps, CommentContent } from '@entities/comment';

import DeleteModal from './modal/delete-comment/DeleteModal';
import EditModal from './modal/edit-comment/EditModal';
import InlineReplyInput from './InlineReplyInput';
import ReplyModal from './modal/reply-comment/ReplyModal';
import CommentBadges from './parts/CommentBadges';
import CommentReplies from './parts/CommentReplies';

/** Avatar encolhe com a profundidade — igual ao protótipo (40 / 34 / 30). */
const avatarSizeForDepth = (depth: number) => (depth === 0 ? 40 : depth === 1 ? 34 : 30);

/** Desktop = composer inline; mobile = modal. */
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)';

const Comment = ({
    data,
    depth = 0,
    parentUserName = null,
    titleId,
    maxDepth,
    reactionsMap,
    onClickProfile,
    onClickEdit,
    onClickDelete,
    onClickReply,
    onLike,
    onDislike,
}: CommentProps) => {
    const { t } = useTranslation('comment');

    const [isReplying, setIsReplying] = useState(false);

    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

    const scrollToParent = useCommentScrollToParent(data.parentCommentId);

    const { isDeleteModalOpen, openDeleteModal, closeDeleteModal, confirmDeleteComment, isEditModalOpen, openEditModal, closeEditModal, confirmEditComment } =
        useCommentModals({
            onDelete: onClickDelete,
            onEdit: onClickEdit,
            commentId: data.id,
        });

    if (!data.textContent && !data.imageContent) {
        return null;
    }

    const { user } = data;

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

    const isReply = depth > 0;
    const replies = data.children ?? [];
    const userReaction = reactionsMap[data.id] ?? null;
    const score = Number(data.likeCount) - Number(data.dislikeCount);
    const activeVote = userReaction === 'LIKE' ? 'up' : userReaction === 'DISLIKE' ? 'down' : null;
    const reachedMaxDepth = depth + 1 >= maxDepth;

    const handleReplySubmit = (replyText: string | null, replyImage: string | null) => {
        onClickReply(data.id, titleId, replyText, replyImage);
        setIsReplying(false);
    };

    const ownerActions = data.isOwner ? (
        <>
            <IconButton icon={Pencil} aria-label={t('actions.edit')} size="sm" variant="ghost" onClick={openEditModal} />
            <IconButton icon={Trash2} aria-label={t('actions.delete')} size="sm" variant="ghost" onClick={openDeleteModal} />
        </>
    ) : null;

    return (
        <div id={`comment-${data.id}`}>
            <PostShell
                avatar={{ src: user.photo, name: user.name }}
                avatarSize={avatarSizeForDepth(depth)}
                onClickAvatar={() => onClickProfile(userData)}
                flat={isReply}
                highlighted={data.isHighlighted}
                className={isReply ? 'cs-flat-post' : undefined}
                replyingTo={
                    isReply && parentUserName ? (
                        <button
                            type="button"
                            onClick={scrollToParent}
                            className="inline-flex items-center gap-1 self-start text-mr-tiny font-mr-semibold text-mr-fg-subtle transition-colors hover:text-mr-accent"
                        >
                            {t('reply.replyingTo')} <span className="font-mr-bold text-mr-accent">{parentUserName}</span>
                        </button>
                    ) : null
                }
            >
                <PostHeader
                    name={user.name}
                    time={formatRelativeDate(data.createdAt)}
                    onClickName={() => onClickProfile(userData)}
                    nameProfileLabel={t('user.viewProfileAria', { name: user.name })}
                    highlighted={data.isHighlighted}
                    badges={<CommentBadges isMember={!!user.member?.isMember} isModerator={!!user.moderator?.isModerator} wasEdited={data.wasEdited} />}
                />
                <CommentContent textContent={data.textContent} imageContent={data.imageContent} user={userData} />
                <ActionBar
                    vote={
                        <VotePill
                            value={score}
                            active={activeVote}
                            onUp={() => onLike(data.id)}
                            onDown={() => onDislike(data.id)}
                            label={t('actions.voteGroup')}
                            upLabel={t('actions.like')}
                            downLabel={t('actions.dislike')}
                        />
                    }
                    onReply={() => {
                        if (!requireAuth(t('reply.authAction'))) return;

                        setIsReplying(true);
                    }}
                    replyLabel={t('actions.reply')}
                    extra={ownerActions}
                />

                {isReplying &&
                    (isDesktop ? (
                        <InlineReplyInput onSubmit={handleReplySubmit} onCancel={() => setIsReplying(false)} />
                    ) : (
                        <ReplyModal isOpen onSubmit={handleReplySubmit} onCancel={() => setIsReplying(false)} />
                    ))}

                {replies.length > 0 && (
                    <CommentReplies
                        replies={replies}
                        parentName={user.name}
                        reachedMaxDepth={reachedMaxDepth}
                        renderReply={reply => (
                            <Comment
                                data={reply}
                                depth={depth + 1}
                                parentUserName={user.name}
                                titleId={titleId}
                                maxDepth={maxDepth}
                                reactionsMap={reactionsMap}
                                onClickProfile={onClickProfile}
                                onClickEdit={onClickEdit}
                                onClickDelete={onClickDelete}
                                onClickReply={onClickReply}
                                onLike={onLike}
                                onDislike={onDislike}
                            />
                        )}
                        renderLeaf={(node, pName) => (
                            <Comment
                                data={{ ...node, children: [] }}
                                depth={maxDepth}
                                parentUserName={pName}
                                titleId={titleId}
                                maxDepth={maxDepth}
                                reactionsMap={reactionsMap}
                                onClickProfile={onClickProfile}
                                onClickEdit={onClickEdit}
                                onClickDelete={onClickDelete}
                                onClickReply={onClickReply}
                                onLike={onLike}
                                onDislike={onDislike}
                            />
                        )}
                    />
                )}
            </PostShell>

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
                initialText={data.textContent}
                initialImages={data.imageContent}
            />
        </div>
    );
};

export default Comment;
