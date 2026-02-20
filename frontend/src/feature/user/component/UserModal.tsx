import { useUserModalContext } from '../context/useUserModalContext';

import BaseModal from '@shared/component/modal/base/BaseModal';
import UserModalHeader from './UserModalHeader';
import UserModalBody from './UserModalBody';

const UserModal = () => {
    const { isUserModalOpen, closeUserModal } = useUserModalContext();

    // const fetchUserData = async () => {}; // TODO: Implementar função para buscar os dados do usuário

    // useEffect(() => {
    //  fetchUserData(id);
    // });

    return (
        <BaseModal isModalOpen={isUserModalOpen} closeModal={closeUserModal}>
            <UserModalHeader />
            <UserModalBody />
        </BaseModal>
    );
};

export default UserModal;
