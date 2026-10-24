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
    if (size <= 32) return 'text-ui-small';
    if (size <= 48) return 'text-ui-body';
    if (size <= 64) return 'text-ui-h4';

    return 'text-ui-h1';
};

export const Avatar = ({ src, initials, name, color, size = 40, onClick }: AvatarProps) => {
    const inits = initials ?? getInitials(name);

    const bgColor = src ? undefined : (color ?? (name ? colorFromName(name) : 'var(--ui-accent)'));

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
            className={`hidden mobile-md:inline-flex shrink-0 items-center justify-center font-ui-extrabold rounded-ui-xs ${fontClassForSize(size)} ${onClick ? 'cursor-pointer hover:opacity-[0.85]' : ''}`}
            style={{
                width: size,
                height: size,
                background: bgColor,
                color: 'var(--ui-primary)',
            }}
        >
            {src ? <img src={src} alt={name ?? ''} loading="lazy" className={`size-full object-cover rounded-ui-xs`} /> : inits}
        </div>
    );
};

export default Avatar;
