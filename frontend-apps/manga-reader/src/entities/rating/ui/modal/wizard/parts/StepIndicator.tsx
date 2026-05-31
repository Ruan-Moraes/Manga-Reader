import { useTranslation } from 'react-i18next';

import { RATING_CATEGORIES } from '../ratingCategories';

type StepIndicatorProps = {
    categoryRatings: Record<string, number>;
    currentStep: number;
    isFinalStep: boolean;
    allCategoriesRated: boolean;
    totalSteps: number;
    onStepClick: (step: number) => void;
};

const StepIndicator = ({ categoryRatings, currentStep, isFinalStep, allCategoriesRated, totalSteps, onStepClick }: StepIndicatorProps) => {
    const { t } = useTranslation('rating');

    return (
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
                            onClick={() => onStepClick(i)}
                            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                                isCurrent
                                    ? 'font-bold text-white border-b-2 border-white'
                                    : isCompleted
                                      ? 'text-quaternary-default border-b-2 border-quaternary-default'
                                      : ''
                            } ${isFuture ? 'text-tertiary opacity-60' : ''}`}
                        >
                            <span>{isCompleted && !isCurrent ? '✓' : `${i + 1}`}</span>
                            <span className="hidden mobile-md:inline">{t(`wizard.categoryLabels.${cat.key}`)}</span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => allCategoriesRated && onStepClick(totalSteps - 1)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded-xs transition-colors cursor-pointer whitespace-nowrap ${
                        isFinalStep
                            ? 'font-bold text-white border-b-2 border-white'
                            : allCategoriesRated
                              ? 'text-quaternary-default'
                              : 'text-tertiary opacity-60'
                    }`}
                >
                    <span>{t('wizard.finalStepLabel')}</span>
                </button>
            </div>
        </div>
    );
};

export default StepIndicator;
