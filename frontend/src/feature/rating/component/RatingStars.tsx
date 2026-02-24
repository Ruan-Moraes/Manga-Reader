import { useRef } from 'react';
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';

type RatingStarsProps = {
    value: number;
    // eslint-disable-next-line no-unused-vars
    onChange?: (rating: number) => void;
    size?: number;
    showValue?: boolean;
    halfPrecision?: boolean;
};

const RatingStars = ({
    value,
    onChange,
    size = 16,
    showValue = false,
    halfPrecision = false,
}: RatingStarsProps) => {
    const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleClick = (
        index: number,
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        if (!onChange) return;

        const starValue = index + 1;

        if (!halfPrecision) {
            onChange(starValue);
            return;
        }

        const button = starRefs.current[index];
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const isLeftHalf = clickX < rect.width / 2;

        onChange(isLeftHalf ? starValue - 0.5 : starValue);
    };

    const renderStar = (index: number) => {
        const starValue = index + 1;
        const isFull = value >= starValue;
        const isHalf = !isFull && value >= starValue - 0.5;

        const iconClass =
            isFull || isHalf
                ? 'text-yellow-400 drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]'
                : 'text-white/80 drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]';

        if (isFull) return <FaStar size={size} className={iconClass} />;
        if (isHalf) return <FaStarHalfAlt size={size} className={iconClass} />;
        return <FaRegStar size={size} className={iconClass} />;
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <button
                        key={index}
                        ref={el => {
                            starRefs.current[index] = el;
                        }}
                        type="button"
                        onClick={e => handleClick(index, e)}
                        className="transition-transform hover:scale-110 disabled:cursor-default cursor-pointer"
                        disabled={!onChange}
                    >
                        {renderStar(index)}
                    </button>
                ))}
            </div>
            {showValue && (
                <span className="text-xs font-semibold text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]">
                    {value.toFixed(1)}
                </span>
            )}
        </div>
    );
};

export default RatingStars;
