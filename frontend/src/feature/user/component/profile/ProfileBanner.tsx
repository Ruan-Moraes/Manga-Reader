type Props = {
    bannerUrl?: string;
    photoUrl?: string;
    name: string;
    onPhotoClick?: () => void;
};

const ProfileBanner = ({ bannerUrl, photoUrl, name, onPhotoClick }: Props) => {
    return (
        <div className="relative">
            <div className="h-40 overflow-hidden rounded-t-xs sm:h-52">
                {bannerUrl ? (
                    <img
                        src={bannerUrl}
                        alt="Banner do perfil"
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
                    className="overflow-hidden border-4 rounded-full border-primary-default w-24 h-24"
                >
                    <img
                        src={photoUrl ?? '/default-avatar.png'}
                        alt={`Foto de ${name}`}
                        className="object-cover w-full h-full"
                    />
                </button>
            </div>
        </div>
    );
};

export default ProfileBanner;
