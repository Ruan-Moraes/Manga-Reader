import { useCallback } from 'react';

import { Modal } from '@ui/Modal';
import EditModalBody from './body/EditModalBody';

type EditModalProps = {
    isOpen: boolean;

    onEdit: (newTextContent: string | null, newImageContent: string | null) => void;
    onCancel: () => void;

    title: string;

    initialText: string | null;
    initialImages: string | null;
};

const EditModal = ({
    isOpen,

    onEdit,
    onCancel,

    title,

    initialText,
    initialImages,
}: EditModalProps) => {
    const handleEdit = useCallback(
        (newTextContent: string | null, newImageContent: string | null) => {
            onEdit(newTextContent, newImageContent);
        },
        [onEdit],
    );

    const handleCancelClick = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        <Modal open={isOpen} onClose={handleCancelClick} title={title}>
            <EditModalBody onEdit={handleEdit} onCancel={handleCancelClick} initialText={initialText} initialImages={initialImages} />
        </Modal>
    );
};

export default EditModal;
