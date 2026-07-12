import { useState } from 'react';

export type StarSize = 12 | 14 | 16 | 18 | 20 | 24;

export interface StarsProps {
    value: number;
    size?: StarSize;
    interactive?: boolean;
    onChange?: (value: number) => void;
    label?: string;
}

const STAR_POINTS = '12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9';

/** Estrela com preenchimento parcial via CSS overflow hidden. */
const StarFill = ({ fillFraction, size }: { fillFraction: number; size: number }) => (
    <span aria-hidden="true" style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
        {/* fundo cinza */}
        <svg width={size} height={size} viewBox="0 0 24 24">
            <polygon points={STAR_POINTS} fill="var(--mr-gray-700)" />
        </svg>
        {/* preenchimento accent clipeado à fração */}
        {fillFraction > 0 && (
            <span
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    overflow: 'hidden',
                    width: `${fillFraction * 100}%`,
                    height: '100%',
                }}
            >
                <svg width={size} height={size} viewBox="0 0 24 24">
                    <polygon points={STAR_POINTS} fill="var(--mr-accent)" />
                </svg>
            </span>
        )}
    </span>
);

export const Stars = ({ value, size = 14, label }: StarsProps) => (
    <span role="img" aria-label={label ?? `${value} de 5 estrelas`} className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <StarFill key={i} fillFraction={Math.min(1, Math.max(0, value - (i - 1)))} size={size} />
        ))}
    </span>
);

/** Input interativo — permite selecionar rating de 1 a 5 */
export const StarsInput = ({ value, onChange, size = 18, label = 'Avalie de 1 a 5' }: StarsProps) => {
    const [hover, setHover] = useState(0);

    const shown = hover || value;

    return (
        <fieldset className="inline-flex min-w-0 shrink-0 gap-1 border-none p-0">
            <legend className="sr-only">{label}</legend>
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange?.(value === i ? 0 : i)}
                    aria-pressed={value >= i}
                    aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
                    className="text-mr-gray-700 hover:text-mr-accent mr-focus-ring"
                >
                    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                        <polygon points={STAR_POINTS} fill={i <= shown ? 'var(--mr-accent)' : 'currentColor'} />
                    </svg>
                </button>
            ))}
        </fieldset>
    );
};

export default Stars;
