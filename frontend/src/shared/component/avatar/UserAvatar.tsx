import { useState } from 'react';
import clsx from 'clsx';

type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type UserAvatarProps = {
    src?: string | null;
    name: string;
    size?: UserAvatarSize;
    rounded?: 'xs' | 'full';
    className?: string;
};

const sizeClasses: Record<UserAvatarSize, { container: string; text: string }> =
    {
        xs: { container: 'w-6 h-6', text: 'text-[0.6rem]' },
        sm: { container: 'w-8 h-8', text: 'text-xs' },
        md: { container: 'w-10 h-10', text: 'text-sm' },
        lg: { container: 'w-12 h-12', text: 'text-lg' },
        xl: { container: 'w-16 h-16', text: 'text-xl' },
        '2xl': { container: 'w-24 h-24', text: 'text-3xl' },
    };

const avatarColors = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600',
    'bg-violet-600',
    'bg-teal-600',
    'bg-fuchsia-600',
];

const getColorForName = (name: string): string => {
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
};

const UserAvatar = ({
    src,
    name,
    size = 'md',
    rounded = 'xs',
    className,
}: UserAvatarProps) => {
    const [imgError, setImgError] = useState(false);
    const config = sizeClasses[size];
    const showImage = src && !imgError;
    const letter = name.charAt(0).toUpperCase();

    return (
        <div
            className={clsx(
                'shrink-0 overflow-hidden',
                config.container,
                rounded === 'full' ? 'rounded-full' : 'rounded-xs',
                !showImage && getColorForName(name),
                className,
            )}
        >
            {showImage ? (
                <img
                    src={src}
                    alt={`Foto de ${name}`}
                    className="object-cover w-full h-full"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className={clsx(
                        'flex items-center justify-center w-full h-full font-bold text-white',
                        config.text,
                    )}
                >
                    {letter}
                </div>
            )}
        </div>
    );
};

export default UserAvatar;
