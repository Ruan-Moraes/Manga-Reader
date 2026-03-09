import clsx from 'clsx';

import { type User } from '@feature/user';

import { MdAdminPanelSettings, MdStar } from 'react-icons/md';

import formatRelativeDate from '@shared/service/util/formatRelativeDate';

type CommentUserProps = {
    user: Partial<User> & { name: string };
    onClickProfile?: (userData: User) => void;
    isHighlighted?: boolean;
    createdAt?: string;
    size?: 'sm' | 'md';
};

const sizeConfig = {
    sm: {
        avatar: 'w-8 h-8',
        avatarFallback: 'text-xs',
        name: 'text-sm',
        badge: 'px-1.5 py-0.5 text-[0.65rem]',
        iconSize: 12,
        date: 'text-[0.6rem]',
    },
    md: {
        avatar: 'w-12 h-12',
        avatarFallback: 'text-lg',
        name: 'text-base',
        badge: 'px-2 py-1 text-xs',
        iconSize: 14,
        date: 'text-[0.7rem]',
    },
} as const;

const CommentUser = ({
    onClickProfile,
    isHighlighted,
    user,
    createdAt,
    size = 'md',
}: CommentUserProps) => {
    const config = sizeConfig[size];
    const isInteractive = !!onClickProfile;

    const handleProfileClick = () => {
        if (onClickProfile) {
            onClickProfile(user as User);
        }
    };

    const AvatarTag = isInteractive ? 'button' : 'div';
    const NameTag = isInteractive ? 'button' : 'div';

    const hasBadges = user.member?.isMember || user.moderator?.isModerator;

    return (
        <div className="flex items-center gap-3">
            <AvatarTag
                onClick={isInteractive ? handleProfileClick : undefined}
                aria-label={
                    isInteractive ? `Ver perfil de ${user.name}` : undefined
                }
                className={clsx(
                    'shrink-0 rounded-xs border border-tertiary bg-secondary p-0 overflow-hidden',
                    config.avatar,
                    isInteractive &&
                        'cursor-pointer hover:border-quaternary-opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-opacity-50 transition-all duration-300',
                )}
            >
                {user.photo ? (
                    <img
                        src={user.photo}
                        alt={`Foto de perfil de ${user.name}`}
                        className="block object-cover w-full h-full"
                    />
                ) : (
                    <div
                        className={clsx(
                            'flex items-center justify-center w-full h-full font-bold bg-quaternary-opacity-25 text-white',
                            config.avatarFallback,
                        )}
                    >
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
            </AvatarTag>
            <div className="flex flex-col justify-center min-w-0 gap-1">
                <div className="flex flex-col gap-2">
                    <NameTag
                        onClick={isInteractive ? handleProfileClick : undefined}
                        className={clsx(
                            'leading-none font-bold truncate bg-transparent border-none p-0 text-left text-shadow-default',
                            config.name,
                            isHighlighted && 'text-shadow-highlight',
                            isInteractive &&
                                'hover:text-shadow-highlight cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-opacity-50 transition-all duration-300',
                        )}
                    >
                        {user.name}
                    </NameTag>
                    {hasBadges && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {user.member?.isMember && (
                                <span
                                    className={clsx(
                                        'flex items-center gap-1 font-bold rounded-xs bg-quaternary-opacity-25',
                                        config.badge,
                                    )}
                                    title="Membro"
                                >
                                    <MdStar size={config.iconSize} />
                                    <span className="leading-none">Membro</span>
                                </span>
                            )}
                            {user.moderator?.isModerator && (
                                <span
                                    className={clsx(
                                        'flex items-center gap-1 font-bold rounded-xs bg-quaternary-opacity-25',
                                        config.badge,
                                    )}
                                    title="Moderador"
                                >
                                    <MdAdminPanelSettings
                                        size={config.iconSize}
                                    />
                                    <span className="leading-none">
                                        Moderador
                                    </span>
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {createdAt && (
                    <span
                        className={clsx(
                            'text-tertiary leading-none',
                            config.date,
                        )}
                    >
                        {formatRelativeDate(createdAt)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CommentUser;
