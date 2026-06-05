import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { ProfileEditModal } from '@entities/user';
import { useAuth } from '@features/auth';

/**
 * Monta o modal de configurações do usuário uma única vez na árvore roteada.
 * Liga o efeito pós-exclusão de conta (logout + redirect) — que pertence à
 * feature de auth — ao modal da entity, respeitando os limites do FSD.
 */
const ProfileSettingsModal = () => {
    const { logout } = useAuth();
    const navigate = useAppNavigate();

    return (
        <ProfileEditModal
            onAccountDeleted={() => {
                logout();
                navigate(ROUTES.HOME);
            }}
        />
    );
};

export default ProfileSettingsModal;
