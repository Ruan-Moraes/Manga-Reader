import { useCallback, useState } from 'react';

import RatingStars from '../../RatingStars';

import FinalScoreCard from './FinalScoreCard';

import { RATING_CATEGORIES } from './ratingCategories';
import DarkButton from '@shared/component/button/DarkButton.tsx';

type CategoryRatings = Record<string, number>;
type CategoryComments = Record<string, string>;

type RatingSubmitData = {
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
};

type RatingSubmitFn = (data: RatingSubmitData) => void;

type RatingWizardProps = {
    onSubmit: RatingSubmitFn;
    onCancel: () => void;
    isSubmitting?: boolean;
};

const TOTAL_STEPS = RATING_CATEGORIES.length + 1; // 6 categories + final

const RatingWizard = ({
    onSubmit,
    onCancel,
    isSubmitting = false,
}: RatingWizardProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>(
        () =>
            Object.fromEntries(
                RATING_CATEGORIES.map(c => [c.key, -1]),
            ) as CategoryRatings,
    );
    const [categoryComments, setCategoryComments] = useState<CategoryComments>(
        () =>
            Object.fromEntries(
                RATING_CATEGORIES.map(c => [c.key, '']),
            ) as CategoryComments,
    );

    const isFinalStep = currentStep === TOTAL_STEPS - 1;
    const currentCategory = isFinalStep ? null : RATING_CATEGORIES[currentStep];

    const allCategoriesRated = Object.values(categoryRatings).every(v => v > 0);

    const computeAverage = useCallback(() => {
        const rated = Object.values(categoryRatings).filter(v => v > 0);

        if (rated.length === 0) return 0;

        return rated.reduce((a, b) => a + b, 0) / rated.length;
    }, [categoryRatings]);

    const handleCategoryRating = (value: number) => {
        if (!currentCategory) return;
        setCategoryRatings(prev => ({ ...prev, [currentCategory.key]: value }));
    };

    const handleCategoryComment = (value: string) => {
        if (!currentCategory) return;
        setCategoryComments(prev => ({
            ...prev,
            [currentCategory.key]: value,
        }));
    };

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS - 1) setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleStepClick = (step: number) => {
        if (
            step <= currentStep ||
            categoryRatings[RATING_CATEGORIES[step]?.key] > 0
        ) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = () => {
        if (!allCategoriesRated) return;

        const commentParts = RATING_CATEGORIES.map(
            c => categoryComments[c.key],
        ).filter(Boolean);

        const combinedComment =
            commentParts.length > 0 ? commentParts.join(' | ') : undefined;

        onSubmit({
            funRating: categoryRatings['funRating'],
            artRating: categoryRatings['artRating'],
            storylineRating: categoryRatings['storylineRating'],
            charactersRating: categoryRatings['charactersRating'],
            originalityRating: categoryRatings['originalityRating'],
            pacingRating: categoryRatings['pacingRating'],
            comment: combinedComment,
        });
    };

    const handleReset = () => {
        setCurrentStep(0);

        setCategoryRatings(
            Object.fromEntries(
                RATING_CATEGORIES.map(c => [c.key, -1]),
            ) as CategoryRatings,
        );

        setCategoryComments(
            Object.fromEntries(
                RATING_CATEGORIES.map(c => [c.key, '']),
            ) as CategoryComments,
        );
    };

    const renderStepIndicator = () => (
        <div className="overflow-x-auto scrollbar-hidden">
            <div className="flex items-center gap-1 min-w-max pb-2">
                {RATING_CATEGORIES.map((cat, i) => {
                    const isCompleted = categoryRatings[cat.key] > 0;
                    const isCurrent = i === currentStep;
                    const isFuture = !isCompleted && !isCurrent;

                    return (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => handleStepClick(i)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                                isCurrent
                                    ? 'font-bold text-white border-b-2 border-white'
                                    : isCompleted
                                      ? 'text-quaternary-default border-b-2 border-quaternary-default'
                                      : ''
                            } ${isFuture ? 'text-tertiary opacity-60' : ''}`}
                        >
                            <span>
                                {isCompleted && !isCurrent ? '✓' : `${i + 1}`}
                            </span>
                            <span className="hidden mobile-md:inline">
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() =>
                        allCategoriesRated && handleStepClick(TOTAL_STEPS - 1)
                    }
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                        isFinalStep
                            ? 'font-bold text-white border-b-2 border-white'
                            : allCategoriesRated
                              ? 'text-quaternary-default'
                              : 'text-tertiary opacity-60'
                    }`}
                >
                    <span>Nota</span>
                </button>
            </div>
        </div>
    );

    const renderCategoryStep = () => {
        if (!currentCategory) return null;

        const currentRating = categoryRatings[currentCategory.key];
        const currentComment = categoryComments[currentCategory.key];

        const isRated = currentRating > 0;

        const canAdvance = isRated;

        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 pt-2">
                    <span className="text-2xl">{currentCategory.icon}</span>
                    <h3 className="text-sm font-bold text-shadow-default">
                        Avalie: {currentCategory.label}
                    </h3>
                    <p className="text-xs text-tertiary text-center max-w-xs">
                        {currentCategory.description}
                    </p>
                </div>
                <div className="flex justify-center py-2">
                    <RatingStars
                        value={isRated ? currentRating : 0}
                        onChange={handleCategoryRating}
                        size={28}
                        showValue={isRated}
                        halfPrecision
                    />
                </div>
                <textarea
                    value={currentComment}
                    onChange={e => handleCategoryComment(e.target.value)}
                    placeholder="Comentário opcional..."
                    rows={2}
                    className="w-full p-2 text-xs border rounded-xs resize-none bg-primary-default border-tertiary placeholder:text-tertiary focus:border-quaternary-default focus:outline-none transition-colors"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={currentStep === 0 ? onCancel : handleBack}
                        className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors cursor-pointer"
                    >
                        {currentStep === 0 ? 'Cancelar' : 'Voltar'}
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canAdvance}
                        className="flex-1 px-4 py-2 text-sm border rounded-xs bg-primary-default border-primary-default hover:bg-primary-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Próximo
                    </button>
                </div>
            </div>
        );
    };

    const renderFinalStep = () => (
        <FinalScoreCard
            average={computeAverage()}
            categoryRatings={categoryRatings}
            categories={RATING_CATEGORIES}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
            allCategoriesRated={allCategoriesRated}
        />
    );

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold leading-none">
                    Avaliar obra
                </h2>
                <DarkButton
                    text="Fechar"
                    onClick={() => {
                        handleReset();

                        onCancel();
                    }}
                />
            </div>
            {renderStepIndicator()}
            <div
                key={currentStep}
                className="animate-fade-in"
                style={{ animation: 'fadeIn 300ms ease-in-out' }}
            >
                {isFinalStep ? renderFinalStep() : renderCategoryStep()}
            </div>
        </div>
    );
};

export default RatingWizard;
