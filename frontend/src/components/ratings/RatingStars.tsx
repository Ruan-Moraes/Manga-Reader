import { FaStar } from 'react-icons/fa';

type RatingStarsProps = {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
    showValue?: boolean;
};

const RatingStars = ({
    value,
    onChange,
    size = 16,
    showValue = false,
}: RatingStarsProps) => {
    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => {
                    const starValue = index + 1;
                    const isActive = value >= starValue;

                    return (
                        <button
                            key={starValue}
                            type="button"
                            onClick={() => onChange?.(starValue)}
                            className="transition-transform hover:scale-110"
                        >
                            <FaStar
                                size={size}
                                className={
                                    isActive
                                        ? 'text-yellow-400'
                                        : 'text-tertiary'
                                }
                            />
                        </button>
                    );
                })}
            </div>
            {showValue && <span className="text-xs">{value.toFixed(1)}</span>}
        </div>
    );
};

export default RatingStars;
