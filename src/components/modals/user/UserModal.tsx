import { SOCIAL_MEDIA_COLORS } from '../../../constants/SOCIAL_MEDIA_COLORS';

import { useUserModalContext } from '../../../context/modals/user/useUserModalContext';

import treatDate from '../../../services/utils/treatDate';

import BaseModal from '../base/BaseModal';
import SocialMedia from '../../social-medias/SocialMedia';

const UserModal = () => {
  const { isUserModalOpen, closeUserModal, userData } = useUserModalContext();

  // const fetchUserData = async () => {}; // TODO: Implementar função para buscar os dados do usuário

  // useEffect(() => {
  // fetchUserData(id);
  // });

  if (!isUserModalOpen) {
    return null;
  }

  if (!userData) {
    return null;
  }

  return (
    <BaseModal isModalOpen={isUserModalOpen} closeModal={closeUserModal}>
      <div className="flex justify-end">
        <button
          onClick={closeUserModal}
          className="px-2 py-1 text-xs font-bold rounded-xs shadow-lg bg-primary-default"
        >
          Fechar
        </button>
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
              {userData.moderator?.isModerator && (
                <span className="text-xs font-normal text-tertiary">
                  Moderador desde{' '}
                  {treatDate(userData.moderator.since, {
                    year: 'numeric',
                    month: 'long',
                  })}
                </span>
              )}
              {userData.member?.isMember && (
                <span className="text-xs font-normal text-tertiary">
                  Membro desde{' '}
                  {treatDate(userData.member.since, {
                    year: 'numeric',
                    month: 'long',
                  })}
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
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <h4 className="font-bold leading-none text-shadow-default">Bio:</h4>
          <p className="text-xs text-shadow-default">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam
            velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius
            ducimus iure fugiat har.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold leading-none text-shadow-default">
            Redes sociais:
          </h4>
          <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
            <SocialMedia
              className="rounded-xs"
              color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
              href="https://www.instagram.com/"
              name="Instagram"
            />
            <SocialMedia
              className="rounded-xs"
              color={SOCIAL_MEDIA_COLORS.X}
              href="https://twitter.com/"
              name="X (Twitter)"
            />
            <SocialMedia
              className="rounded-xs"
              color={SOCIAL_MEDIA_COLORS.FACEBOOK}
              href="https://www.facebook.com/"
              name="Facebook"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold leading-none text-shadow-default">
            Estatísticas:
          </h4>
          <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
            <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
              <span className="text-xs leading-none text-center text-nowrap">
                1000 Comentários
              </span>
            </li>
            <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
              <span className="text-xs leading-none text-center text-nowrap">
                1000 Likes
              </span>
            </li>
            <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
              <span className="text-xs leading-none text-center text-nowrap">
                1000 Deslikes
              </span>
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-bold leading-none text-shadow-default">
            Obras que recomendo:
          </h4>
          <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hidden">
            <div className="h-32 w-28 shrink-0">
              <img
                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                alt="Imagem de uma obra"
                className="object-cover w-full h-full rounded-xs"
              />
            </div>
            <div className="h-32 w-28 shrink-0">
              <img
                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                alt="Imagem de uma obra"
                className="object-cover w-full h-full rounded-xs"
              />
            </div>
            <div className="h-32 w-28 shrink-0">
              <img
                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                alt="Imagem de uma obra"
                className="object-cover w-full h-full rounded-xs"
              />
            </div>
            <div className="h-32 w-28 shrink-0">
              <img
                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                alt="Imagem de uma obra"
                className="object-cover w-full h-full rounded-xs"
              />
            </div>
            <div className="h-32 w-28 shrink-0">
              <img
                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                alt="Imagem de uma obra"
                className="object-cover w-full h-full rounded-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default UserModal;
