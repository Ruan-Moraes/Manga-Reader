import { useCallback, useMemo, useState } from 'react';

import { type User, useUserModalContext, UserModal } from '@feature/user';
import { type CommentData } from '../type/comment.types';

import useCommentTree from '../hook/internal/useCommentTree';
import useCommentCRUD from '../hook/internal/useCommentCRUD';
import useCommentPagination from '../hook/useCommentPagination';
import useCommentReactions from '../hook/internal/useCommentReactions';
import Comment from './Comment';

type CommentsListProps = {
    titleId: string;
    comments?: CommentData[];
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
};

const CommentsList = ({
    titleId,
    comments,
    isLoading,
    isError,
    error,
}: CommentsListProps) => {
    const { openUserModal, setUserData } = useUserModalContext();

    const { deleteComment, editComment, replyComment } = useCommentCRUD();

    const { getCommentsTree } = useCommentTree(comments || []);

    const commentsTree = comments ? getCommentsTree() : [];

    const { visibleItems, hasMore, loadMore } =
        useCommentPagination(commentsTree);

    const commentIds = useMemo(
        () => (comments ?? []).map(c => c.id),
        [comments],
    );

    const { reactionsMap, toggleLike, toggleDislike } =
        useCommentReactions(commentIds);

    const [showDeepComments, setShowDeepComments] = useState(false);

    const MAX_VISUAL_DEPTH = 5;

    const deepCount = visibleItems.filter(
        item => item.nestedLevel > MAX_VISUAL_DEPTH,
    ).length;

    const displayItems = showDeepComments
        ? visibleItems
        : visibleItems.filter(
              item => item.nestedLevel <= MAX_VISUAL_DEPTH,
          );

    const handleClickProfile = useCallback(
        (user: User): void => {
            setUserData({
                id: user.id,
                role: user.role,
                moderator: user.moderator,
                member: user.member,
                name: user.name,
                photo: user.photo,
                bio: user.bio,
                socialMediasLinks: user.socialMediasLinks,
                statistics: user.statistics,
                recommendedTitles: user.recommendedTitles,
            });

            openUserModal();
        },
        [openUserModal, setUserData],
    );

    if (isLoading) {
        return (
            <div className="text-center text-tertiary">
                Carregando comentários...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center text-quinary-default">
                {error!.message || 'Erro desconhecido'}
            </div>
        );
    }

    return (
        <div className="flex flex-col -mt-8">
            <UserModal />
            {deepCount > 0 && (
                <button
                    type="button"
                    onClick={() => setShowDeepComments(prev => !prev)}
                    className="self-start text-xs text-quaternary-default hover:text-quaternary-light transition-colors cursor-pointer mt-4"
                >
                    {showDeepComments
                        ? '− Ocultar respostas profundas'
                        : `+ Mostrar ${deepCount} ${deepCount === 1 ? 'resposta profunda' : 'respostas profundas'}`}
                </button>
            )}
            {displayItems.map(({ comment, nestedLevel, parentUserName }) => (
                <Comment
                    key={comment.id}
                    titleId={titleId}
                    onClickProfile={handleClickProfile}
                    onClickEdit={editComment}
                    onClickDelete={deleteComment}
                    onClickReply={replyComment}
                    onLike={toggleLike}
                    onDislike={toggleDislike}
                    nestedLevel={nestedLevel}
                    parentUserName={parentUserName}
                    id={comment.id}
                    parentCommentId={comment.parentCommentId}
                    user={comment.user}
                    isOwner={comment.isOwner}
                    isHighlighted={comment.isHighlighted}
                    wasEdited={comment.wasEdited}
                    createdAt={comment.createdAt}
                    textContent={comment.textContent}
                    imageContent={comment.imageContent}
                    likeCount={comment.likeCount}
                    dislikeCount={comment.dislikeCount}
                    userReaction={
                        (reactionsMap[comment.id] as
                            | 'LIKE'
                            | 'DISLIKE'
                            | undefined) ?? null
                    }
                />
            ))}
            {hasMore && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="mt-4 self-center text-sm font-semibold text-quaternary-default hover:text-quaternary-light transition-colors cursor-pointer"
                >
                    Ver mais comentários
                </button>
            )}
            {commentsTree.length === 0 && !isLoading && !isError && (
                <div className="text-gray-400 text-center mt-12 font-bold">
                    Nenhum comentário encontrado.
                </div>
            )}
        </div>
    );
};

export default CommentsList;
