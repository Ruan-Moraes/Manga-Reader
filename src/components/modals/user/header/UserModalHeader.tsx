import { useUserModalContext } from '../../../../context/modals/user/useUserModalContext';

import treatDate from '../../../../services/utils/treatDate';

import BlackButton from '../../../buttons/BlackButton';

const UserModalHeader = () => {
  const { closeUserModal, userData } = useUserModalContext();

  const dateOptions = {
    year: 'numeric' as const,
    month: 'long' as const,
  };

  return (
    <div>
      <div className="flex justify-end">
        <BlackButton onClick={closeUserModal} text="fechar" />
      </div>
      <div className="flex gap-2 border-b border-b-tertiary scrollbar-hidden">
        <div className="h-28 w-28 shrink-0">
          <img
            src={userData!.photo}
            alt={`Foto de perfil de ${userData!.name}`}
            className="object-cover w-full h-full border border-b-0 rounded-xs rounded-b-none bg-secondary border-tertiary"
          />
        </div>
        <div
          style={{ maxWidth: 'calc(100% - 7.5rem)' }}
          className="flex flex-col justify-center gap-2"
        >
          <div className="overflow-x-auto">
            <h3 className="flex flex-col gap-0.5 font-bold leading-none text-nowrap text-shadow-default">
              <span>{userData!.name}</span>
              {userData?.moderator?.isModerator && (
                <span className="text-xs font-normal text-tertiary">
                  Moderador desde{' '}
                  {treatDate(userData.moderator.since, dateOptions)}
                </span>
              )}
              {userData?.member?.isMember && (
                <span className="text-xs font-normal text-tertiary">
                  Membro desde {treatDate(userData.member.since, dateOptions)}
                </span>
              )}
            </h3>
          </div>
          <div>
            <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
              {userData!.moderator?.isModerator && (
                <li className="flex items-center justify-center p-2 rounded-xs bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    Moderador
                  </span>
                </li>
              )}
              {userData!.member?.isMember && (
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
