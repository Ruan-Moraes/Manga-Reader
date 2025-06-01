import { SOCIAL_MEDIA_COLORS } from '../../../../../constants/SOCIAL_MEDIA_COLORS';

import { useUserModalContext } from '../../../../../context/modals/user/useUserModalContext';

import SocialMedia from '../../../../social-medias/SocialMedia';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const UserModalBody = () => {
    const { userData } = useUserModalContext();

    return (
        <div className="flex flex-col gap-4 mt-2">
            {userData?.bio && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        Bio:
                    </h4>
                    <p className="text-xs text-shadow-default">
                        {userData.bio}
                    </p>
                </div>
            )}
            {userData?.socialMediasLinks && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        Redes sociais:
                    </h4>
                    <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                        {userData.socialMediasLinks.map(socialMedia => (
                            <SocialMedia
                                link={socialMedia.link}
                                name={socialMedia.name}
                                color={
                                    SOCIAL_MEDIA_COLORS[
                                        socialMedia.name as SocialMediaName
                                    ]
                                }
                            />
                        ))}
                    </div>
                </div>
            )}
            {/* TODO: Termina de fazer lógicas */}
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
