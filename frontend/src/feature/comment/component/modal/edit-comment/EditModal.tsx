import { useCallback } from 'react';

import BaseModal from '@shared/component/modal/base/BaseModal';
import EditModalHeader from './header/EditModalHeader';
import EditModalBody from './body/EditModalBody';

type EditModalProps = {
    isOpen: boolean;

    onEdit: (
        newTextContent: string | null,
        newImageContent: string | null,
    ) => void;
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
