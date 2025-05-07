import { SOCIAL_MEDIA_COLORS } from '../../../../constants/SOCIAL_MEDIA_COLORS';

import { useUserModalContext } from '../../../../context/modals/user/useUserModalContext';

import SocialMedia from '../../../social-medias/SocialMedia';

const UserModalBody = () => {
  const { userData } = useUserModalContext();

  return (
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
  );
};

export default UserModalBody;
