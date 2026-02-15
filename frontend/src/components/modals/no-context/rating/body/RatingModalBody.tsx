import { useCallback, useEffect, useRef, useState } from 'react';

import Select, { SelectOption } from '../../../../ui/Select';

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

    const categories = [
        { key: 'Diversion', label: 'Diversão', icon: '🎉' },
        { key: 'Art', label: 'Arte', icon: '🎨' },
        { key: 'Storyline', label: 'Enredo', icon: '📖' },
        { key: 'Characters', label: 'Personagens', icon: '👤' },
        { key: 'Originality', label: 'Originalidade', icon: '💡' },
        { key: 'Pacing', label: 'Ritmo', icon: '⏱' },
    ];

    const ratingOptions = [
        { value: -1, label: 'Não avaliado', selected: false, disabled: true },
        { value: 0, label: 'Nota: 0' },
        { value: 1, label: 'Nota: 1' },
        { value: 2, label: 'Nota: 2' },
        { value: 3, label: 'Nota: 3' },
        { value: 4, label: 'Nota: 4' },
        { value: 5, label: 'Nota: 5' },
    ];

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
                    Classifique o título em cada categoria abaixo. A nota final
                    será calculada com base nas suas avaliações.
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
                            <Select
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
                                placeholder="Selecione uma nota"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="border-t border-tertiary pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold">Nota Final:</span>
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
