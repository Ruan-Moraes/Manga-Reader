import { useTranslation } from 'react-i18next';

import { SOCIAL_MEDIA_COLORS } from '@shared/constant/SOCIAL_MEDIA_COLORS';

import { useUserModalContext } from '../context/useUserModalContext';

import SocialMediaLink from '@shared/component/social-media/SocialMediaLink';

type SocialMediaName = keyof typeof SOCIAL_MEDIA_COLORS;

const UserModalBody = () => {
    const { t } = useTranslation('user');
    const { userData } = useUserModalContext();

    return (
        <div className="flex flex-col gap-4 mt-2">
            {userData?.bio && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        {t('modal.body.bio')}
                    </h4>
                    <p className="text-xs text-shadow-default">
                        {userData.bio}
                    </p>
                </div>
            )}
            {userData?.socialMediasLinks && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        {t('modal.body.socialMedia')}
                    </h4>
                    <div className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                        {userData.socialMediasLinks.map(socialMedia => (
                            <SocialMediaLink
                                key={socialMedia.link}
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
            {userData?.statistics && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        {t('modal.body.statistics')}
                    </h4>
                    <ul className="flex gap-1 overflow-x-auto flex-nowrap scrollbar-hidden">
                        <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
                            <span className="text-xs leading-none text-center text-nowrap">
                                {t('modal.body.commentsCount', { count: 1000 })}
                            </span>
                        </li>
                        <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
                            <span className="text-xs leading-none text-center text-nowrap">
                                {t('modal.body.likesCount', { count: 1000 })}
                            </span>
                        </li>
                        <li className="flex items-center gap-1 p-2 rounded-xs bg-quaternary-opacity-25">
                            <span className="text-xs leading-none text-center text-nowrap">
                                {t('modal.body.dislikesCount', { count: 1000 })}
                            </span>
                        </li>
                    </ul>
                </div>
            )}
            {userData?.recommendedTitles && (
                <div className="flex flex-col gap-2">
                    <h4 className="font-bold leading-none text-shadow-default">
                        {t('modal.body.recommendedWorks')}
                    </h4>
                    <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hidden">
                        <div className="h-32 w-28 shrink-0">
                            <img
                                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                                alt={t('modal.body.workAlt')}
                                className="object-cover w-full h-full rounded-xs"
                            />
                        </div>
                        <div className="h-32 w-28 shrink-0">
                            <img
                                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                                alt={t('modal.body.workAlt')}
                                className="object-cover w-full h-full rounded-xs"
                            />
                        </div>
                        <div className="h-32 w-28 shrink-0">
                            <img
                                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                                alt={t('modal.body.workAlt')}
                                className="object-cover w-full h-full rounded-xs"
                            />
                        </div>
                        <div className="h-32 w-28 shrink-0">
                            <img
                                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                                alt={t('modal.body.workAlt')}
                                className="object-cover w-full h-full rounded-xs"
                            />
                        </div>
                        <div className="h-32 w-28 shrink-0">
                            <img
                                src="https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg"
                                alt={t('modal.body.workAlt')}
                                className="object-cover w-full h-full rounded-xs"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserModalBody;
