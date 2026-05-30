export type AvatarSize = 24 | 32 | 40 | 48 | 64 | 96;

export type AvatarShape = 'square' | 'circle';

export interface AvatarProps {
    src?: string;
    initials?: string;
    name?: string;
    color?: string;
    size?: AvatarSize;
    shape?: AvatarShape;
    onClick?: () => void;
}

const getInitials = (name?: string) =>
    (name ?? '??')
        .split(' ')
        .slice(0, 2)
        .map(s => s[0])
        .join('')
        .toUpperCase();

const hashToHue = (s: string) => {
    let h = 0;

    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;

    return Math.abs(h) % 360;
};

export const colorFromName = (name: string) => `hsl(${hashToHue(name)}, 60%, 60%)`;

const fontBySize: Record<AvatarSize, string> = {
    24: 'text-[10px]',
    32: 'text-mr-small',
    40: 'text-mr-body',
    48: 'text-mr-body',
    64: 'text-mr-h4',
    96: 'text-mr-h1',
};

export const Avatar = ({ src, initials, name, color, size = 44, shape = 'square', onClick }: AvatarProps) => {
    const inits = initials ?? getInitials(name);

    const radiusClass = shape === 'circle' ? 'rounded-mr-full' : 'rounded-mr-xs';

    const bgColor = src ? undefined : (color ?? (name ? colorFromName(name) : 'var(--mr-accent)'));

    return (
        <div
            onClick={onClick}
            onKeyDown={
                onClick
                    ? e => {
                          if (e.key === 'Enter' || e.key === ' ') onClick();
                      }
                    : undefined
            }
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={onClick ? (name ?? 'Abrir perfil') : undefined}
            className={`inline-flex shrink-0 items-center justify-center font-mr-extrabold ${radiusClass} ${fontBySize[size]} ${onClick ? 'cursor-pointer hover:opacity-[0.85]' : ''}`}
            style={{
                width: size,
                height: size,
                background: bgColor,
                color: 'var(--mr-primary)',
            }}
        >
            {src ? <img src={src} alt={name ?? ''} loading="lazy" className={`size-full object-cover ${radiusClass}`} /> : inits}
        </div>
    );
};

export default Avatar;
