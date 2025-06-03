import { useCallback, useState } from 'react';

type UseCommentModalsProps = {
    onDelete: (id: string) => void;
    onEdit: (id: string, newTextContent: string | null, newImageContent: string | null) => void;

    commentId: string;
};

const useCommentModal = ({
    onDelete,
    onEdit,

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

    const confirmEditComment = useCallback((newTextContent: string | null, newImageContent: string | null) => {
        onEdit(commentId, newTextContent, newImageContent);

        closeEditModal();
    }, [onEdit, commentId, closeEditModal]);

    return {
        isDeleteModalOpen,
        openDeleteModal,
        closeDeleteModal,
        confirmDeleteComment,
        isEditModalOpen,
        openEditModal,
        closeEditModal,
        confirmEditComment,
    };
};

export default useCommentModal;
