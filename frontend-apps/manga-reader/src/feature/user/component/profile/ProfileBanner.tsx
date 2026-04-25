import { useTranslation } from 'react-i18next';

import UserAvatar from '@shared/component/avatar/UserAvatar';

type Props = {
    bannerUrl?: string;
    photoUrl?: string;
    name: string;
    onPhotoClick?: () => void;
};

const ProfileBanner = ({ bannerUrl, photoUrl, name, onPhotoClick }: Props) => {
    const { t } = useTranslation('user');

    return (
        <div className="relative">
            <div className="h-40 overflow-hidden rounded-t-xs sm:h-52">
                {bannerUrl ? (
                    <img
                        src={bannerUrl}
                        alt={t('profile.banner.alt')}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-quaternary/40 to-quinary-default/30" />
                )}
            </div>
            <div className="absolute -bottom-12 left-6">
                <button
                    type="button"
                    onClick={onPhotoClick}
                    className="border-4 rounded-full border-primary-default"
                >
                    <UserAvatar
                        src={photoUrl}
                        name={name}
                        size="2xl"
                        rounded="full"
                    />
                </button>
            </div>
        </div>
    );
};

export default ProfileBanner;
