import { useCallback } from 'react';

import BaseModal from '../../base/BaseModal';
import DeleteModalHeader from './header/DeleteModalHeader';
import DeleteModalBody from './body/DeleteModalBody';

type DeleteModalProps = {
    isOpen: boolean;

    title: string;
    message: string;

    onConfirm: () => void;
    onCancel: () => void;
};

const DeleteModal = ({
    isOpen,

    title,
    message,

    onConfirm,
    onCancel,
}: DeleteModalProps) => {
    const handleConfirm = useCallback(() => {
        onConfirm();
    }, [onConfirm]);

    const handleCancelClick = useCallback(() => {
        onCancel();
    }, [onCancel]);

    return (
        isOpen && (
            <BaseModal isModalOpen={isOpen} closeModal={handleCancelClick}>
                <div className="flex flex-col gap-2 p-2">
                    <DeleteModalHeader title={title} />
                    <DeleteModalBody
                        message={message}
                        onConfirm={handleConfirm}
                        onCancel={handleCancelClick}
                    />
                </div>
            </BaseModal>
        )
    );
};

export default DeleteModal;
