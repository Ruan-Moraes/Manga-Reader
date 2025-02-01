import React from 'react';
import Modal from 'react-modal';

import { SOCIAL_MEDIA_COLORS } from '../../constants/SOCIAL_MEDIA_COLORS';

import SocialMedia from '../social-medias/SocialMedia';
import Blur from '../blur/Blur';

type UserModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userName: string;
  userPhoto: string;
};

const UserModal = ({
  isModalOpen,
  setIsModalOpen,
  userName,
  userPhoto,
}: UserModalProps) => {
  return (
    <>
      <Blur isOpen={true} onChange={setIsModalOpen} />
      <div className="fixed left-0 right-0 z-20 flex flex-col gap-2 mx-4 -translate-y-1/2 top-1/2">
        <div className="z-20 flex flex-col gap-2 p-2 border rounded-sm bg-secondary border-tertiary">
          <div className="flex justify-end">
            <button className="px-2 py-1 text-xs font-bold rounded-sm shadow-lg bg-primary-default">
              <span>Fechar</span>
            </button>
          </div>
          <div className="flex gap-2 border-b border-b-tertiary scrollbar-hidden">
            <div className="h-28 w-28 shrink-0">
              <img
                src={userPhoto}
                alt={`Foto de perfil de ${userName}`}
                className="object-cover w-full h-full border border-b-0 rounded-sm rounded-b-none bg-secondary border-tertiary"
              />
            </div>
            <div
              style={{ maxWidth: 'calc(100% - 7.5rem)' }}
              className="flex flex-col gap-2 py-2"
            >
              <div className="overflow-x-auto">
                <h3 className="flex flex-col font-bold leading-none text-nowrap text-shadow-default">
                  <span>{userName}</span>
                  <span>
                    <span className="text-xs font-normal text-tertiary">
                      Membro desde 2021
                    </span>
                  </span>
                </h3>
              </div>
              <div>
                <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                  <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                    <span className="text-xs leading-none text-center text-nowrap">
                      Membro
                    </span>
                  </li>
                  <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                    <span className="text-xs leading-none text-center text-nowrap">
                      Moderador
                    </span>
                  </li>
                  <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                    <span className="text-xs leading-none text-center text-nowrap">
                      Membro
                    </span>
                  </li>
                  <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                    <span className="text-xs leading-none text-center text-nowrap">
                      Apreciador de café
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <h4 className="font-bold leading-none text-shadow-default">
                Bio:
              </h4>
              <p className="text-xs text-shadow-default">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi,
                nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum
                quod eius ducimus iure fugiat har.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-bold leading-none text-shadow-default">
                Redes sociais:
              </h4>
              <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                <SocialMedia
                  className="rounded-sm"
                  color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
                  href="https://www.instagram.com/"
                  name="Instagram"
                />
                <SocialMedia
                  className="rounded-sm"
                  color={SOCIAL_MEDIA_COLORS.X}
                  href="https://twitter.com/"
                  name="X (Twitter)"
                />
                <SocialMedia
                  className="rounded-sm"
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
                <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    1000 Comentários
                  </span>
                </li>
                <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    1000 Likes
                  </span>
                </li>
                <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    100 Deslikes
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
                    className="object-cover w-full h-full rounded-sm"
                  />
                </div>
                <div className="h-32 w-28 shrink-0">
                  <img
                    src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                    alt="Imagem de uma obra"
                    className="object-cover w-full h-full rounded-sm"
                  />
                </div>
                <div className="h-32 w-28 shrink-0">
                  <img
                    src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                    alt="Imagem de uma obra"
                    className="object-cover w-full h-full rounded-sm"
                  />
                </div>
                <div className="h-32 w-28 shrink-0">
                  <img
                    src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                    alt="Imagem de uma obra"
                    className="object-cover w-full h-full rounded-sm"
                  />
                </div>
                <div className="h-32 w-28 shrink-0">
                  <img
                    src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                    alt="Imagem de uma obra"
                    className="object-cover w-full h-full rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Modal
        isOpen={true}
        onRequestClose={() => setIsModalOpen(false)}
        className="flex flex-col gap-2 p-2 m-4 border rounded-sm bg-secondary border-tertiary"
        // overlayClassName="fixed inset-0 z-10 flex items-center justify-center w-full h-full"
      >
        <div className="flex justify-end">
          <button className="px-2 py-1 text-xs font-bold rounded-sm shadow-lg bg-primary-default">
            <span>Fechar</span>
          </button>
        </div>
        <div className="flex gap-2 border-b border-b-tertiary scrollbar-hidden">
          <div className="h-28 w-28 shrink-0">
            <img
              src={userPhoto}
              alt={`Foto de perfil de ${userName}`}
              className="object-cover w-full h-full border border-b-0 rounded-sm rounded-b-none bg-secondary border-tertiary"
            />
          </div>
          <div className="flex flex-col gap-2 py-2">
            <div className="overflow-x-auto">
              <h3 className="flex flex-col font-bold leading-none text-nowrap text-shadow-default">
                <span>{userName} Batata com arroz</span>
                <span>
                  <span className="text-xs font-normal text-tertiary">
                    Membro desde 2021
                  </span>
                </span>
              </h3>
            </div>
            <div>
              <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    Membro
                  </span>
                </li>
                <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    Moderador
                  </span>
                </li>
                <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    Membro
                  </span>
                </li>
                <li className="flex items-center justify-center p-2 rounded-sm bg-quaternary-opacity-25">
                  <span className="text-xs leading-none text-center text-nowrap">
                    Moderador
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <h4 className="font-bold leading-none text-shadow-default">Bio:</h4>
            <p className="text-xs text-shadow-default">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi,
              nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum
              quod eius ducimus iure fugiat har.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold leading-none text-shadow-default">
              Redes sociais:
            </h4>
            <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
              {/* <SocialMedia
                className="rounded-sm"
                color={SOCIAL_MEDIA_COLORS.INSTAGRAM}
                href="https://www.instagram.com/"
                name="Instagram"
              />
              <SocialMedia
                className="rounded-sm"
                color={SOCIAL_MEDIA_COLORS.X}
                href="https://twitter.com/"
                name="X (Twitter)"
              />
              <SocialMedia
                className="rounded-sm"
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
              <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                <span className="text-xs leading-none text-center text-nowrap">
                  1000000 Seguidores
                </span>
              </li>
              <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                <span className="text-xs leading-none text-center text-nowrap">
                  1000 Comentários
                </span>
              </li>
              <li className="flex items-center gap-1 p-2 rounded-sm bg-quaternary-opacity-25">
                <span className="text-xs leading-none text-center text-nowrap">
                  1000 Likes
                </span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-bold leading-none text-shadow-default">
              Obras que recomendo:
            </h4>
            <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hidden">
              <div className="w-24 h-32">
                <img
                  src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                  alt="Imagem de uma obra"
                  className="object-cover w-full h-full rounded-sm"
                />
              </div>
              <div className="w-24 h-32">
                <img
                  src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                  alt="Imagem de uma obra"
                  className="object-cover w-full h-full rounded-sm"
                />
              </div>
              <div className="w-24 h-32">
                <img
                  src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                  alt="Imagem de uma obra"
                  className="object-cover w-full h-full rounded-sm"
                />
              </div>
              <div className="w-24 h-32">
                <img
                  src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                  alt="Imagem de uma obra"
                  className="object-cover w-full h-full rounded-sm"
                />
              </div>
              <div className="w-24 h-32">
                <img
                  src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                  alt="Imagem de uma obra"
                  className="object-cover w-full h-full rounded-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal> */}
    </>
  );
};

export default UserModal;
