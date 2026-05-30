import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Illustration, { type IllustrationType } from '@shared/component/ui/Illustration';
import { Select } from '@ui/Select';

type CategoryRating = {
    [key: string]: number;
};

type RatingModalBodyProps = {
    onRatingChange: (rating: number) => void;
    onAllCategoriesRated?: (allRated: boolean) => void;
};

const RatingModalBody = ({ onRatingChange, onAllCategoriesRated }: RatingModalBodyProps) => {
    const { t } = useTranslation('rating');
    const [categoryRatings, setCategoryRatings] = useState<CategoryRating>({
        Diversion: -1,
        Art: -1,
        Storyline: -1,
        Characters: -1,
        Originality: -1,
        Pacing: -1,
    });

    const categories = useMemo(
        () => [
            {
                key: 'Diversion',
                label: t('modal.categories.fun'),
                iconType: 'feliz' as IllustrationType,
            },
            {
                key: 'Art',
                label: t('modal.categories.art'),
                iconType: 'pensando' as IllustrationType,
            },
            {
                key: 'Storyline',
                label: t('modal.categories.storyline'),
                iconType: 'feliz' as IllustrationType,
            },
            {
                key: 'Characters',
                label: t('modal.categories.characters'),
                iconType: 'feliz' as IllustrationType,
            },
            {
                key: 'Originality',
                label: t('modal.categories.originality'),
                iconType: 'surpresa' as IllustrationType,
            },
            {
                key: 'Pacing',
                label: t('modal.categories.pacing'),
                iconType: 'duvida' as IllustrationType,
            },
        ],
        [t],
    );

    const ratingOptions = useMemo(
        () => [
            { value: '-1', label: t('modal.notRated'), disabled: true },
            { value: '0', label: t('modal.scoreOption', { value: 0 }) },
            { value: '1', label: t('modal.scoreOption', { value: 1 }) },
            { value: '2', label: t('modal.scoreOption', { value: 2 }) },
            { value: '3', label: t('modal.scoreOption', { value: 3 }) },
            { value: '4', label: t('modal.scoreOption', { value: 4 }) },
            { value: '5', label: t('modal.scoreOption', { value: 5 }) },
        ],
        [t],
    );

    const handleCategoryChange = (category: string, value: number) => {
        setCategoryRatings(prev => ({
            ...prev,
            [category]: value,
        }));
    };

    const calculateTotalScore = useCallback(() => {
        const ratings = Object.values(categoryRatings);

        const total = ratings.reduce((sum, rating) => sum + (rating === -1 ? 0 : rating), 0);

        const totalCategories = ratings.length;
        const average = totalCategories > 0 ? total / totalCategories : 0;

        const scaled = average * 2;
        return Math.min(Math.max(scaled, 0), 10);
    }, [categoryRatings]);

    const totalScore = calculateTotalScore();
    const allRated = Object.values(categoryRatings).every(rating => rating !== -1);

    useEffect(() => {
        onRatingChange(Math.round(totalScore * 100) / 100);

        if (onAllCategoriesRated) {
            onAllCategoriesRated(allRated);
        }
    }, [totalScore, allRated, onRatingChange, onAllCategoriesRated]);

    return (
        <div className="flex flex-col gap-4 pb-2">
            <div>
                <p className="text-xs text-center">{t('modal.instructions')}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto pr-2">
                {categories.map(category => (
                    <div key={category.key} className="flex flex-col gap-1">
                        <label className="flex items-center gap-2 text-sm">
                            <Illustration type={category.iconType} className="w-5 h-5 object-contain" />
                            <span className="font-bold text-shadow-default leading-none">{category.label}</span>
                        </label>
                        <Select
                            options={ratingOptions}
                            value={String(categoryRatings[category.key])}
                            onChange={e => handleCategoryChange(category.key, Number(e.target.value))}
                            placeholder={t('modal.selectPlaceholder')}
                        />
                    </div>
                ))}
            </div>
            <div className="border-t border-tertiary pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{t('modal.finalScore')}</span>
                    <span className="text-sm font-bold">{(totalScore / 2).toFixed(2)} / 5</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-quaternary-opacity-75 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(totalScore / 10) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default RatingModalBody;
