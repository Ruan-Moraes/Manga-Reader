import { useNavigate } from 'react-router-dom';

import { useUserModalContext } from '../context/useUserModalContext';

import formatDate from '@shared/service/util/formatDate';

import DarkButton from '@shared/component/button/DarkButton';

const UserModalHeader = () => {
    const navigate = useNavigate();

    const { closeUserModal, userData } = useUserModalContext();

    const dateOptions = {
        year: 'numeric' as const,
        month: 'long' as const,
    };

    const handleGoToProfile = () => {
        if (!userData) return;

        closeUserModal();
        navigate(`/Manga-Reader/users/${userData.id}`);
    };

    if (!userData) return null;

    return (
        <div>
            <div className="flex justify-end">
                <DarkButton onClick={closeUserModal} text="fechar" />
            </div>
            <div className="flex gap-2 border-b border-b-tertiary scrollbar-hidden">
                <button
                    type="button"
                    onClick={handleGoToProfile}
                    className="h-28 w-28 shrink-0"
                    aria-label={`Abrir perfil de ${userData.name}`}
                >
                    <img
                        src={userData.photo}
                        alt={`Foto de perfil de ${userData.name}`}
                        className="object-cover w-full h-full border border-b-0 rounded-xs rounded-b-none bg-secondary border-tertiary"
                    />
                </button>
                <div
                    style={{ maxWidth: 'calc(100% - 7.5rem)' }}
                    className="flex flex-col justify-center gap-2"
                >
                    <div className="overflow-x-auto">
                        <h3 className="flex flex-col gap-0.5 font-bold leading-none text-nowrap text-shadow-default">
                            <button
                                type="button"
                                onClick={handleGoToProfile}
                                className="text-left hover:text-quaternary-default"
                            >
                                {userData.name}
                            </button>
                            {userData.moderator?.isModerator && (
                                <span className="text-xs font-normal text-tertiary">
                                    Moderador desde{' '}
                                    {formatDate(
                                        userData.moderator.since,
                                        dateOptions,
                                    )}
                                </span>
                            )}
                            {userData.member?.isMember && (
                                <span className="text-xs font-normal text-tertiary">
                                    Membro desde{' '}
                                    {formatDate(
                                        userData.member.since,
                                        dateOptions,
                                    )}
                                </span>
                            )}
                        </h3>
                    </div>
                    <div>
                        <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                            {userData.moderator?.isModerator && (
                                <li className="flex items-center justify-center p-2 rounded-xs bg-quaternary-opacity-25">
                                    <span className="text-xs leading-none text-center text-nowrap">
                                        Moderador
                                    </span>
                                </li>
                            )}
                            {userData.member?.isMember && (
                                <li className="flex items-center justify-center p-2 rounded-xs bg-quaternary-opacity-25">
                                    <span className="text-xs leading-none text-center text-nowrap">
                                        Membro
                                    </span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserModalHeader;
