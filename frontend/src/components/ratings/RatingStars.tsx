import { FaRegStar, FaStar } from 'react-icons/fa';

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
                            className="transition-transform hover:scale-110 disabled:cursor-default"
                            disabled={!onChange}
                        >
                            {isActive ? (
                                <FaStar
                                    size={size}
                                    className="text-yellow-400 drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]"
                                />
                            ) : (
                                <FaRegStar
                                    size={size}
                                    className="text-white/80 drop-shadow-[0_0_2px_rgba(0,0,0,0.95)]"
                                />
                            )}
                        </button>
                    );
                })}
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
