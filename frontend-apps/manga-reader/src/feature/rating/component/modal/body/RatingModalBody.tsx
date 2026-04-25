import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StyledSelect, { SelectOption } from '@shared/component/ui/StyledSelect';

type CategoryRating = {
    [key: string]: number;
};

type RatingModalBodyProps = {
    onRatingChange: (rating: number) => void;
    onAllCategoriesRated?: (allRated: boolean) => void;
};

const RatingModalBody = ({
    onRatingChange,
    onAllCategoriesRated,
}: RatingModalBodyProps) => {
    const { t } = useTranslation('rating');
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const [openSelectKey, setOpenSelectKey] = useState<string | null>(null);
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
            { key: 'Diversion', label: t('modal.categories.fun'), icon: '🎉' },
            { key: 'Art', label: t('modal.categories.art'), icon: '🎨' },
            { key: 'Storyline', label: t('modal.categories.storyline'), icon: '📖' },
            { key: 'Characters', label: t('modal.categories.characters'), icon: '👤' },
            { key: 'Originality', label: t('modal.categories.originality'), icon: '💡' },
            { key: 'Pacing', label: t('modal.categories.pacing'), icon: '⏱' },
        ],
        [t],
    );

    const ratingOptions = useMemo(
        () => [
            { value: -1, label: t('modal.notRated'), selected: false, disabled: true },
            { value: 0, label: t('modal.scoreOption', { value: 0 }) },
            { value: 1, label: t('modal.scoreOption', { value: 1 }) },
            { value: 2, label: t('modal.scoreOption', { value: 2 }) },
            { value: 3, label: t('modal.scoreOption', { value: 3 }) },
            { value: 4, label: t('modal.scoreOption', { value: 4 }) },
            { value: 5, label: t('modal.scoreOption', { value: 5 }) },
        ],
        [t],
    );

    const handleCategoryChange = (category: string, value: number) => {
        setCategoryRatings(prev => ({
            ...prev,
            [category]: value,
        }));
    };

    const handleMenuOpen = (categoryKey: string) => {
        setOpenSelectKey(categoryKey);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.overflow = 'hidden';
            scrollContainerRef.current.style.paddingRight = '0';
        }

        setTimeout(() => {
            const selectElement = selectRefs.current[categoryKey];

            if (!selectElement) {
                return;
            }

            selectElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest',
            });
        }, 50);
    };

    const handleMenuClose = () => {
        setOpenSelectKey(null);

        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.overflow = 'auto';
            scrollContainerRef.current.style.paddingRight = '0.5rem';
        }
    };

    const calculateTotalScore = useCallback(() => {
        const ratings = Object.values(categoryRatings);

        const total = ratings.reduce(
            (sum, rating) => sum + (rating === -1 ? 0 : rating),
            0,
        );

        const totalCategories = ratings.length;
        const average = totalCategories > 0 ? total / totalCategories : 0;

        const scaled = average * 2;
        return Math.min(Math.max(scaled, 0), 10);
    }, [categoryRatings]);

    const totalScore = calculateTotalScore();
    const allRated = Object.values(categoryRatings).every(
        rating => rating !== -1,
    );

    useEffect(() => {
        onRatingChange(Math.round(totalScore * 100) / 100);

        if (onAllCategoriesRated) {
            onAllCategoriesRated(allRated);
        }
    }, [totalScore, allRated, onRatingChange, onAllCategoriesRated]);

    return (
        <div className="flex flex-col gap-4 pb-2">
            <div>
                <p className="text-xs text-center">
                    {t('modal.instructions')}
                </p>
            </div>
            <div
                ref={scrollContainerRef}
                className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto pr-2"
            >
                {categories.map(category => {
                    const isCurrentSelectOpen = openSelectKey === category.key;
                    const shouldHideSelect =
                        openSelectKey !== null && !isCurrentSelectOpen;

                    return (
                        <div
                            key={category.key}
                            ref={(el: HTMLDivElement | null) => {
                                selectRefs.current[category.key] = el;
                            }}
                            className="flex flex-col gap-1"
                            style={{
                                visibility: shouldHideSelect
                                    ? 'hidden'
                                    : 'visible',
                            }}
                        >
                            <label className="flex items-center gap-1 text-sm">
                                <span className="text-lg">{category.icon}</span>
                                <span className="font-bold text-shadow-default leading-none">
                                    {category.label}
                                </span>
                            </label>
                            <StyledSelect
                                variant="rating"
                                options={ratingOptions}
                                value={ratingOptions.find(
                                    option =>
                                        option.value ===
                                        categoryRatings[category.key],
                                )}
                                onChange={selectedOption => {
                                    if (
                                        selectedOption &&
                                        !Array.isArray(selectedOption)
                                    ) {
                                        handleCategoryChange(
                                            category.key,
                                            Number(
                                                (selectedOption as SelectOption)
                                                    .value,
                                            ),
                                        );
                                    }
                                }}
                                onMenuOpen={() => handleMenuOpen(category.key)}
                                onMenuClose={handleMenuClose}
                                isSearchable={false}
                                placeholder={t('modal.selectPlaceholder')}
                            />
                        </div>
                    );
                })}
            </div>
            <div className="border-t border-tertiary pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">{t('modal.finalScore')}</span>
                    <span className="text-sm font-bold">
                        {(totalScore / 2).toFixed(2)} / 5
                    </span>
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
