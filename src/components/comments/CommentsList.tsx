import { useCallback } from 'react';

import { UserTypes } from '../../types/UserTypes'; // Ajuste o caminho se necessário

import { useUserModalContext } from '../../context/modals/user/useUserModalContext';
import { useComments } from '../../hooks/comments/useComments'; // Importe o hook orquestrador

import UserModal from '../modals/with-context/user/UserModal';
import Comment from './Comment';

const CommentsList = () => {
    const { openUserModal, setUserData } = useUserModalContext();

    const {
        commentsTree,
        isLoading,
        isError,
        error,
        deleteComment,
        editComment,
        // isDeletingComment, // Você pode usar esses estados para mostrar spinners globais
        // isEditingComment,
        // deleteCommentError,
        // editCommentError,
    } = useComments();

    const handleClickProfile = useCallback(
        (user: UserTypes): void => {
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
                Erro ao carregar comentários:{' '}
                {error?.message || 'Erro desconhecido'}
            </div>
        );
    }

    return (
        <div className="flex flex-col -mt-4">
            <UserModal />
            {commentsTree.map(({ comment, nestedLevel }) => (
                <Comment
                    key={comment.id}
                    onClickProfile={handleClickProfile}
                    onClickEdit={editComment}
                    onClickDelete={deleteComment}
                    nestedLevel={nestedLevel}
                    id={comment.id}
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
                <div className="text-gray-400 text-center py-8">
                    Nenhum comentário encontrado.
                </div>
            )}
        </div>
    );
};

export default CommentsList;
