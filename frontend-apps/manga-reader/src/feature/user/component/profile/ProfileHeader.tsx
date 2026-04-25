import { useTranslation } from 'react-i18next';

type Props = {
    name: string;
    role: string;
    bio?: string;
    createdAt?: string;
    isOwner: boolean;
    onEdit?: () => void;
};

const roleKey = (role: string): string => {
    switch (role) {
        case 'admin':
            return 'admin';
        case 'poster':
            return 'poster';
        default:
            return 'reader';
    }
};

const roleBadgeColor = (role: string) => {
    switch (role) {
        case 'admin':
            return 'bg-quinary-default/20 text-quinary-default';
        case 'poster':
            return 'bg-quaternary/20 text-quaternary';
        default:
            return 'bg-tertiary/20 text-tertiary';
    }
};

const ProfileHeader = ({
    name,
    role,
    bio,
    createdAt,
    isOwner,
    onEdit,
}: Props) => {
    const { t, i18n } = useTranslation('user');

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString(i18n.language, {
              year: 'numeric',
              month: 'long',
          })
        : null;

    return (
        <div className="pt-14 px-4 pb-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">{name}</h1>
                        <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${roleBadgeColor(role)}`}
                        >
                            {t(`profile.header.roles.${roleKey(role)}`)}
                        </span>
                    </div>
                    {formattedDate && (
                        <p className="text-xs text-tertiary mt-1">
                            {t('profile.header.memberSince', {
                                date: formattedDate,
                            })}
                        </p>
                    )}
                </div>
                {isOwner && onEdit && (
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 text-xs font-medium border rounded-xs border-tertiary hover:bg-tertiary/20 transition-colors"
                    >
                        {t('profile.header.edit')}
                    </button>
                )}
            </div>
            {bio && <p className="mt-3 text-sm text-tertiary">{bio}</p>}
        </div>
    );
};

export default ProfileHeader;
