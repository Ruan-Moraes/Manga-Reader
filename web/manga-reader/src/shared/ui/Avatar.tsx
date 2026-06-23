export interface AvatarProps {
    src?: string;
    initials?: string;
    name?: string;
    color?: string;
    /** Diâmetro em px. A fonte das iniciais escala por faixa. */
    size?: number;
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

    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }

    return Math.abs(h) % 360;
};

export const colorFromName = (name: string) => `hsl(${hashToHue(name)}, 60%, 60%)`;

// Fonte das iniciais escala por faixa de tamanho (porte do CSAvatar do protótipo).
const fontClassForSize = (size: number): string => {
    if (size <= 24) return 'text-[10px]';
    if (size <= 32) return 'text-mr-small';
    if (size <= 48) return 'text-mr-body';
    if (size <= 64) return 'text-mr-h4';

    return 'text-mr-h1';
};

export const Avatar = ({ src, initials, name, color, size = 40, onClick }: AvatarProps) => {
    const inits = initials ?? getInitials(name);

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
            className={`hidden mobile-md:inline-flex shrink-0 items-center justify-center font-mr-extrabold rounded-mr-xs ${fontClassForSize(size)} ${onClick ? 'cursor-pointer hover:opacity-[0.85]' : ''}`}
            style={{
                width: size,
                height: size,
                background: bgColor,
                color: 'var(--mr-primary)',
            }}
        >
            {src ? <img src={src} alt={name ?? ''} loading="lazy" className={`size-full object-cover rounded-mr-xs`} /> : inits}
        </div>
    );
};

export default Avatar;
