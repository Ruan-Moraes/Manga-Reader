import { ICON_PATHS, type IconName } from './icon/iconPaths';

export { ICON_PATHS, type IconName };
export { AppleGlyph, PlayGlyph } from './icon/StoreGlyphs';
export { RatingStars } from './RatingStars';

export interface IconProps {
    name: IconName;
    size?: number;
    stroke?: number;
    className?: string;
}

export default function Icon({
    name,
    size = 24,
    stroke = 2,
    className,
}: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
        >
            {ICON_PATHS[name]}
        </svg>
    );
}
