import { useUserModalContext } from '../model/useUserModalContext';
import useUserDetails from '../model/useUserDetails';

import { Modal } from '@ui/Modal';
import UserModalHeader, { type UserModalHeaderUser } from './UserModalHeader';
import UserModalBody from './UserModalBody';

const UserModal = () => {
    const { isUserModalOpen, closeUserModal, userId, seed } = useUserModalContext();

    // Busca o perfil completo por id apenas enquanto o modal está aberto.
    const { user, isLoading } = useUserDetails(isUserModalOpen ? (userId ?? undefined) : undefined);

    // Cabeçalho usa o seed (nome/foto do comentário/resenha) de imediato; o corpo espera o perfil.
    const headerUser: UserModalHeaderUser | null = user ?? (seed && userId ? { id: userId, name: seed.name, photo: seed.photo ?? '' } : null);

    return (
        <Modal open={isUserModalOpen} onClose={closeUserModal} title={headerUser?.name ?? ''}>
            <div className="flex flex-col gap-5">
                <UserModalHeader user={headerUser} />
                <UserModalBody user={user} loading={isLoading} />
            </div>
        </Modal>
    );
};

export default UserModal;
