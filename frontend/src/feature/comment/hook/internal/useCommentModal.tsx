import { useCallback, useState } from 'react';

type UseCommentModalsProps = {
    onDelete: (id: string) => void;
    onEdit: (
        id: string,
        newTextContent: string | null,
        newImageContent: string | null,
    ) => void;
    onReply: (
        id: string,
        textContent: string | null,
        imageContent: string | null,
    ) => void;

    commentId: string;
};

const useCommentModal = ({
    onDelete,
    onEdit,
    onReply,

    commentId,
}: UseCommentModalsProps) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const openDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setIsDeleteModalOpen(false);
    }, []);

    const confirmDeleteComment = useCallback(() => {
        onDelete(commentId);

        closeDeleteModal();
    }, [onDelete, commentId, closeDeleteModal]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const openEditModal = useCallback(() => {
        setIsEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        setIsEditModalOpen(false);
    }, []);

    const confirmEditComment = useCallback(
        (newTextContent: string | null, newImageContent: string | null) => {
            onEdit(commentId, newTextContent, newImageContent);

            closeEditModal();
        },
        [onEdit, commentId, closeEditModal],
    );

    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

    const openReplyModal = useCallback(() => {
        setIsReplyModalOpen(true);
    }, []);

    const closeReplyModal = useCallback(() => {
        setIsReplyModalOpen(false);
    }, []);

    const confirmReplyComment = useCallback(
        (textContent: string | null, imageContent: string | null) => {
            if (onReply) {
                onReply(commentId, textContent, imageContent);
            }

            closeReplyModal();
        },
        [onReply, commentId, closeReplyModal],
    );

    return {
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
    };
};

export default useCommentModal;
