import { Modal } from '@ui/Modal';
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
        <Modal open={isOpen} onClose={onCancel} title={title} footer={<DeleteModalFooter onConfirm={onConfirm} onCancel={onCancel} />}>
            <DeleteModalBody message={message} />
        </Modal>
    );
};

export default DeleteModal;
