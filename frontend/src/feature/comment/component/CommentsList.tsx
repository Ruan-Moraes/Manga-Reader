import { useCallback } from 'react';

import { type User, useUserModalContext, UserModal } from '@feature/user';
import { type CommentData } from '../type/comment.types';

import useCommentTree from '../hook/internal/useCommentTree';
import useCommentCRUD from '../hook/internal/useCommentCRUD';
import Comment from './Comment';

type CommentsListProps = {
    comments?: CommentData[];
    isLoading?: boolean;
    isError?: boolean;
    error?: Error | null;
};

const CommentsList = ({
    comments,
    isLoading,
    isError,
    error,
}: CommentsListProps) => {
    const { openUserModal, setUserData } = useUserModalContext();

    const { deleteComment, editComment, replyComment } = useCommentCRUD();

    const { getCommentsTree } = useCommentTree(comments || []);

    const commentsTree = comments ? getCommentsTree() : [];

    const handleClickProfile = useCallback(
        (user: User): void => {
            setUserData({
                id: user.id,
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
            {commentsTree.map(({ comment, nestedLevel }) => (
                <Comment
                    key={comment.id}
                    onClickProfile={handleClickProfile}
                    onClickEdit={editComment}
                    onClickDelete={deleteComment}
                    onClickReply={replyComment}
                    nestedLevel={nestedLevel}
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
                />
            ))}
            {commentsTree.length === 0 && !isLoading && !isError && (
                <div className="text-gray-400 text-center mt-12 font-bold">
                    Nenhum comentário encontrado.
                </div>
            )}
        </div>
    );
};

export default CommentsList;
