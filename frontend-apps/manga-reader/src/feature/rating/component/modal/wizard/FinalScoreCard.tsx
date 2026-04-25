import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RatingStars from '../../RatingStars';

type Category = {
    readonly key: string;
    readonly icon: string;
};

type FinalScoreCardProps = {
    average: number;
    categoryRatings: Record<string, number>;
    categories: readonly Category[];
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting: boolean;
    allCategoriesRated: boolean;
};

const CIRCLE_RADIUS = 44;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
const CIRCLE_SIZE = 120;
const STROKE_WIDTH = 6;

const getScoreColor = (score: number): string => {
    if (score < 2) return '#FF784F';
    if (score <= 3.5) return '#ddda2a';
    return '#22c55e';
};

const FinalScoreCard = ({
    average,
    categoryRatings,
    categories,
    onSubmit,
    onBack,
    isSubmitting,
    allCategoriesRated,
}: FinalScoreCardProps) => {
    const { t } = useTranslation('rating');
    const [animatedOffset, setAnimatedOffset] = useState(CIRCLE_CIRCUMFERENCE);

    const displayScore = Math.round(average * 10) / 10;
    const percentage = Math.round((displayScore / 5) * 100);
    const targetOffset =
        CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * displayScore) / 5;
    const scoreColor = getScoreColor(displayScore);

    useEffect(() => {
        setAnimatedOffset(CIRCLE_CIRCUMFERENCE);
        const timer = setTimeout(() => {
            setAnimatedOffset(targetOffset);
        }, 50);
        return () => clearTimeout(timer);
    }, [targetOffset]);

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="relative flex items-center justify-center">
                <svg
                    width={CIRCLE_SIZE}
                    height={CIRCLE_SIZE}
                    viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
                >
                    <circle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke="#727273"
                        strokeWidth={STROKE_WIDTH}
                        opacity={0.3}
                    />
                    <circle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke={scoreColor}
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeDasharray={CIRCLE_CIRCUMFERENCE}
                        strokeDashoffset={animatedOffset}
                        transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                        style={{
                            transition:
                                'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-2xl font-bold leading-none"
                        style={{ color: scoreColor }}
                    >
                        {displayScore.toFixed(1)}
                    </span>
                    <span className="text-[0.6rem] text-tertiary mt-0.5">
                        {percentage}%
                    </span>
                </div>
            </div>

            <RatingStars value={displayScore} size={18} showValue={false} />

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                {categories.map(cat => {
                    const rating = categoryRatings[cat.key];
                    const isRated = rating > 0;

                    return (
                        <div
                            key={cat.key}
                            className="flex items-center justify-between gap-1"
                        >
                            <span className="flex items-center gap-1 text-xs">
                                <span>{cat.icon}</span>
                                <span className="text-tertiary">
                                    {t(`wizard.categoryLabels.${cat.key}`)}
                                </span>
                            </span>
                            <div className="flex items-center gap-1">
                                <RatingStars
                                    value={isRated ? rating : 0}
                                    size={10}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-2 w-full pt-2 border-t border-tertiary">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    {t('wizard.back')}
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!allCategoriesRated || isSubmitting}
                    className="flex-1 px-4 py-2 text-sm font-bold border rounded-xs bg-quaternary-opacity-75 text-primary-default border-quaternary-default hover:bg-quaternary-default disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    {isSubmitting
                        ? t('wizard.submitting')
                        : t('wizard.confirm')}
                </button>
            </div>
        </div>
    );
};

export default FinalScoreCard;
