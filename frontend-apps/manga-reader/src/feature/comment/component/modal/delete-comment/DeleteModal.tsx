import BaseModal from '@shared/component/modal/base/BaseModal';
import DeleteModalHeader from './header/DeleteModalHeader';
import DeleteModalBody from './body/DeleteModalBody';
import DeleteModalFooter from './footer/DeleteModalFooter';

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
    return (
        isOpen && (
            <BaseModal isModalOpen={isOpen} closeModal={onCancel}>
                <div className="flex flex-col gap-3 p-2">
                    <DeleteModalHeader title={title} />
                    <DeleteModalBody message={message} />
                    <DeleteModalFooter
                        onConfirm={onConfirm}
                        onCancel={onCancel}
                    />
                </div>
            </BaseModal>
        )
    );
};

export default DeleteModal;
