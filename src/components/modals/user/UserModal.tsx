import { SOCIAL_MEDIA_COLORS } from '../../../constants/SOCIAL_MEDIA_COLORS';

import { useUserModalContext } from '../../../context/modals/user/useUserModalContext';

import BaseModal from '../base/BaseModal';
import UserModalHeader from './header/UserModalHeader';
import UserModalBody from './body/UserModalBody';
import SocialMedia from '../../social-medias/SocialMedia';

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
