interface RatingStarsProps {
    value?: number;
    size?: number;
}

export function RatingStars({ value = 5, size = 14 }: RatingStarsProps) {
    return (
        <span
            className="inline-flex gap-0.5 text-accent-fg"
            aria-label={`${value} / 5`}
        >
            {[1, 2, 3, 4, 5].map(i => (
                <svg
                    key={i}
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill={i <= value ? '#ddda2a' : '#3a3a1a'}
                    aria-hidden="true"
                >
                    <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />
                </svg>
            ))}
        </span>
    );
}

export default RatingStars;
