import { useUserModalContext } from '../model/useUserModalContext';

import { Modal } from '@ui/Modal';
import UserModalHeader from './UserModalHeader';
import UserModalBody from './UserModalBody';

const UserModal = () => {
    const { isUserModalOpen, closeUserModal, userData } = useUserModalContext();

    return (
        <Modal open={isUserModalOpen} onClose={closeUserModal} title={userData?.name ?? ''}>
            <UserModalHeader />
            <UserModalBody />
        </Modal>
    );
};

export default UserModal;
