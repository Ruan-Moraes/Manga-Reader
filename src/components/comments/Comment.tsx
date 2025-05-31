import clsx from 'clsx';
import {useCallback, useState} from 'react'; // Importe useState e useCallback
import {CommentTypes} from '../../types/CommentTypes';
import {UserTypes} from '../../types/UserTypes';

import ConfirmModal from '../../components/modals/confirm/ConfirmModal'; // Importe o ConfirmModal
import CommentInformation from './header/CommentInformation';
import CommentUser from './header/CommentUser';
import CommentContent from './body/CommentContent';
import CommentActions from './footer/CommentActions';

const Comment = ({
                     onClickProfile,

                     onClickEdit,
                     onClickDelete,

                     id,
                     nestedLevel = 0,

                     user,

                     isOwner,
                     isHighlighted,
                     wasEdited,

                     commentData,
                     textContent,
                     imageContent,

                     likeCount,
                     dislikeCount,
                 }: { nestedLevel?: number } & {
    onClickProfile: (user: UserTypes) => void;
    onClickEdit: () => void;
    onClickDelete: (id: string) => void;
} & CommentTypes) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

    const handleOpenDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
    }, []);

    const handleDeleteComment = useCallback(() => {
        onClickDelete(id);

        handleCloseDeleteModal();
    }, [onClickDelete, id, handleCloseDeleteModal]);

    if (!textContent && !imageContent) {
        return null;
    }

    const userData: UserTypes = {
        id: user.id,
        moderator: user.moderator,
        member: user.member,
        name: user.name,
        photo: user.photo,
    };

    const calculateNastedComment = (nestedLevel: number) => {
        if (nestedLevel === 0) {
            return 0;
        }

        if (nestedLevel === 1) {
            return 8;
        }

        return nestedLevel * 8 + 8 * (nestedLevel - 1);
    };

    const calculateNestedBorder = (index: number) => {
        if (index === 0) {
            return -8;
        }

        if (index === 1) {
            return -24;
        }

        return -(index * 8 + 8 * (index + 1));
    };

    return (
        <div
            style={{marginLeft: calculateNastedComment(nestedLevel) / 16 + 'rem'}}
            className={clsx({
                [`relative`]: nestedLevel > 0,
            })}
        >
            {nestedLevel > 0 &&
                Array.from({length: nestedLevel}, (_, index) => (
                    <div
                        key={index}
                        className="absolute h-full border-l border-quaternary-opacity-25"
                        style={{
                            left: calculateNestedBorder(index) / 16 + 'rem',
                        }}
                    ></div>
                ))}
            {nestedLevel > 0 && (
                <div
                    className="absolute w-[0.9375rem] border-t -left-[0.4453125rem] border-quaternary-opacity-25 top-6"></div>
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
                    }
                )}
            >
                <CommentInformation commentData={commentData} wasEdited={wasEdited}/>
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
                    isOwner={isOwner}
                    onDelete={handleOpenDeleteModal}
                    onEdit={onClickEdit}
                    likeCount={likeCount}
                    dislikeCount={dislikeCount}
                />
            </div>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onConfirm={handleDeleteComment}
                onCancel={handleCloseDeleteModal}
                title="Deletar comentário"
                message="Você tem certeza que deseja deletar este comentário? Essa ação deletará os comentários relacionados a ele."
            />
        </div>
    );
};

export default Comment;
