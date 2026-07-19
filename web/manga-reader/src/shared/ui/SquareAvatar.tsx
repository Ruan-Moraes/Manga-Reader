import { colorFromName } from '@ui/Avatar';
import { cn } from '@shared/lib/cn';

interface SquareAvatarProps {
    /** Iniciais já prontas; se omitidas, derivam de `name`. */
    initials?: string;
    name?: string;
    /** Cor de fundo sólida; se omitida, deriva de `name` via `colorFromName`. */
    color?: string;
    /** Imagem (logo/foto); quando presente, cobre o quadrado e ignora a cor. */
    logo?: string;
    /** Lado do quadrado em px. */
    size: number;
    /** Tamanho da fonte das iniciais. Padrão: proporcional ao lado (`0.36 * size`). */
    fontSize?: number;
    className?: string;
}

const initialsOf = (name: string) =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

/**
 * Avatar **quadrado** raio 2, **sempre visível** (não oculta em telas estreitas), com iniciais
 * sobre cor sólida ou logo. Distinto do primitivo {@link Avatar}, que escala a fonte por faixas e
 * some em telas `< mobile-md`. Usado por fórum e grupos.
 */
export const SquareAvatar = ({ initials, name, color, logo, size, fontSize, className }: SquareAvatarProps) => {
    const inits = initials ?? initialsOf(name ?? '');
    const background = logo ? undefined : (color ?? colorFromName(name ?? ''));

    return (
        <div
            className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-mr-xs font-mr-extrabold text-mr-on-accent', className)}
            style={{ width: size, height: size, background, fontSize: fontSize ?? Math.round(size * 0.36) }}
        >
            {logo ? <img src={logo} alt="" loading="lazy" className="size-full object-cover" /> : inits}
        </div>
    );
};

export default SquareAvatar;
