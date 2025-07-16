import { useState, useEffect } from 'react';
import Select, { SelectOption } from '../../../../ui/Select';

type CategoryRating = {
    [key: string]: number;
};

type RatingModalBodyProps = {
    onRatingChange: (rating: number) => void;
};

const RatingModalBody = ({ onRatingChange }: RatingModalBodyProps) => {
    const [categoryRatings, setCategoryRatings] = useState<CategoryRating>({
        Diversion: 0,
        Art: 0,
        Storyline: 0,
        Characters: 0,
        Originality: 0,
    });

    const categories = [
        { key: 'Diversion', label: 'Diversão', icon: '🎉' },
        { key: 'Art', label: 'Arte', icon: '🎨' },
        { key: 'Storyline', label: 'História', icon: '📖' },
        { key: 'Characters', label: 'Personagens', icon: '👤' },
        { key: 'Originality', label: 'Originalidade', icon: '💡' },
    ];

    const ratingOptions = [
        { value: 0, label: 'Selecione o nível...', isDisabled: true },
        { value: 0.4167, label: 'Baixo' },
        { value: 0.8333, label: 'Médio' },
        { value: 1.25, label: 'Alto' },
    ];

    const handleCategoryChange = (category: string, value: number) => {
        setCategoryRatings(prev => ({
            ...prev,
            [category]: value,
        }));
    };

    const calculateTotalScore = () => {
        const total = Object.values(categoryRatings).reduce(
            (sum, rating) => sum + rating,
            0,
        );

        return Math.min(Math.max(total, 0), 10);
    };

    const totalScore = calculateTotalScore();

    useEffect(() => {
        const totalScore = calculateTotalScore();

        onRatingChange(Math.round(totalScore * 100) / 100);
    }, [calculateTotalScore, categoryRatings, onRatingChange]);

    return (
        <div className="flex flex-col gap-4 pb-2">
            <div className="text-center">
                <p className="text-xs text-gray-600">
                    Classifique o título em cada categoria abaixo. A nota final
                    será calculada com base nas suas avaliações.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-80 overflow-y-auto pr-2">
                {categories.map(category => (
                    <div key={category.key} className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-sm">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-bold text-shadow-default leading-none">
                                {category.label}
                            </span>
                        </label>
                        <Select
                            variant="rating"
                            value={ratingOptions.find(
                                option =>
                                    option.value ===
                                    categoryRatings[category.key],
                            )}
                            onChange={(selectedOption) => {
                                if (selectedOption && !Array.isArray(selectedOption)) {
                                    handleCategoryChange(
                                        category.key,
                                        Number((selectedOption as SelectOption).value),
                                    );
                                }
                            }}
                            options={ratingOptions}
                            placeholder="Selecione o nível..."
                            isSearchable={false}
                        />
                    </div>
                ))}
            </div>
            <div className="border-t border-tertiary pt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Nota Final:</span>
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(10)].map((_, i) => (
                                <span
                                    key={i}
                                    className={`text-lg ${
                                        i < Math.floor(totalScore)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>
                        <span className="text-lg font-bold text-primary">
                            {totalScore.toFixed(2)}/10
                        </span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(totalScore / 10) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default RatingModalBody;
