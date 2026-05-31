import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FinalScoreCard from './FinalScoreCard';
import CategoryStep from './parts/CategoryStep';
import StepIndicator from './parts/StepIndicator';

import { RATING_CATEGORIES } from './ratingCategories';
import { Button } from '@ui/Button';

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

const TOTAL_STEPS = RATING_CATEGORIES.length + 1;

const RatingWizard = ({ onSubmit, onCancel, isSubmitting = false }: RatingWizardProps) => {
    const { t } = useTranslation('rating');
    const [currentStep, setCurrentStep] = useState(0);
    const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>(
        () => Object.fromEntries(RATING_CATEGORIES.map(c => [c.key, -1])) as CategoryRatings,
    );
    const [categoryComments, setCategoryComments] = useState<CategoryComments>(
        () => Object.fromEntries(RATING_CATEGORIES.map(c => [c.key, ''])) as CategoryComments,
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
        if (step <= currentStep || categoryRatings[RATING_CATEGORIES[step]?.key] > 0) {
            setCurrentStep(step);
        }
    };

    const handleSubmit = () => {
        if (!allCategoriesRated) return;

        const commentParts = RATING_CATEGORIES.map(c => categoryComments[c.key]).filter(Boolean);

        const combinedComment = commentParts.length > 0 ? commentParts.join(' | ') : undefined;

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

        setCategoryRatings(Object.fromEntries(RATING_CATEGORIES.map(c => [c.key, -1])) as CategoryRatings);

        setCategoryComments(Object.fromEntries(RATING_CATEGORIES.map(c => [c.key, ''])) as CategoryComments);
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold leading-none">{t('wizard.title')}</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        handleReset();
                        onCancel();
                    }}
                >
                    {t('wizard.close')}
                </Button>
            </div>
            <StepIndicator
                categoryRatings={categoryRatings}
                currentStep={currentStep}
                isFinalStep={isFinalStep}
                allCategoriesRated={allCategoriesRated}
                totalSteps={TOTAL_STEPS}
                onStepClick={handleStepClick}
            />
            <div key={currentStep} className="animate-fade-in" style={{ animation: 'fadeIn 300ms ease-in-out' }}>
                {isFinalStep || !currentCategory ? (
                    <FinalScoreCard
                        average={computeAverage()}
                        categoryRatings={categoryRatings}
                        categories={RATING_CATEGORIES}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                        isSubmitting={isSubmitting}
                        allCategoriesRated={allCategoriesRated}
                    />
                ) : (
                    <CategoryStep
                        category={currentCategory}
                        rating={categoryRatings[currentCategory.key]}
                        comment={categoryComments[currentCategory.key]}
                        isFirstStep={currentStep === 0}
                        onRate={handleCategoryRating}
                        onComment={handleCategoryComment}
                        onCancel={onCancel}
                        onBack={handleBack}
                        onNext={handleNext}
                    />
                )}
            </div>
        </div>
    );
};

export default RatingWizard;
