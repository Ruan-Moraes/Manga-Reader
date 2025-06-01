import { useCallback } from 'react';

import BaseModal from '../../base/BaseModal';
import EditModalHeader from './header/EditModalHeader';
import EditModalBody from './body/EditModalBody';

type EditModalProps = {
    isOpen: boolean;

    onEdit: (newTextContent?: string, newImageContent?: string) => void;
    onCancel: () => void;

    title: string;
    initialText?: string;
    initialImages?: string;
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
        (newTextContent?: string, newImageContent?: string) => {
            onEdit(newTextContent, newImageContent);
        },
        [onEdit],
    );

    const handleCancelClick = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        isOpen && (
            <BaseModal isModalOpen={isOpen} closeModal={handleCancelClick}>
                <div className="flex flex-col gap-2 p-2">
                    <EditModalHeader title={title} />
                    <EditModalBody
                        onEdit={handleEdit}
                        onCancel={handleCancelClick}
                        initialText={initialText}
                        initialImages={initialImages}
                    />
                </div>
            </BaseModal>
        )
    );
};

export default EditModal;
