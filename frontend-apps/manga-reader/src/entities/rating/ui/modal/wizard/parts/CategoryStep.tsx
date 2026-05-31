import { useTranslation } from 'react-i18next';

import Illustration from '@ui/Illustration';

import RatingStars from '../../../RatingStars';
import type { RatingCategory } from '../ratingCategories';

type CategoryStepProps = {
    category: RatingCategory;
    rating: number;
    comment: string;
    isFirstStep: boolean;
    onRate: (value: number) => void;
    onComment: (value: string) => void;
    onCancel: () => void;
    onBack: () => void;
    onNext: () => void;
};

const CategoryStep = ({ category, rating, comment, isFirstStep, onRate, onComment, onCancel, onBack, onNext }: CategoryStepProps) => {
    const { t } = useTranslation('rating');

    const isRated = rating > 0;
    const categoryLabel = t(`wizard.categoryLabels.${category.key}`);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 pt-2">
                <Illustration type={category.iconType} className="w-8 h-8 object-contain" />
                <h3 className="text-sm font-bold text-shadow-default">{t('wizard.rateLabel', { label: categoryLabel })}</h3>
                <p className="text-xs text-tertiary text-center max-w-xs">{t(`wizard.categoryDescriptions.${category.key}`)}</p>
            </div>
            <div className="flex justify-center py-2">
                <RatingStars value={isRated ? rating : 0} onChange={onRate} size={28} showValue={isRated} halfPrecision />
            </div>
            <textarea
                value={comment}
                onChange={e => onComment(e.target.value)}
                placeholder={t('wizard.commentPlaceholder')}
                rows={2}
                className="w-full p-2 text-xs border rounded-xs resize-none bg-primary-default border-tertiary placeholder:text-tertiary focus:border-quaternary-default focus:outline-none transition-colors"
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={isFirstStep ? onCancel : onBack}
                    className="flex-1 px-4 py-2 text-sm border rounded-xs border-tertiary bg-tertiary hover:bg-secondary hover:border-secondary transition-colors cursor-pointer"
                >
                    {isFirstStep ? t('wizard.cancel') : t('wizard.back')}
                </button>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={!isRated}
                    className="flex-1 px-4 py-2 text-sm border rounded-xs bg-primary-default border-primary-default hover:bg-primary-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    {t('wizard.next')}
                </button>
            </div>
        </div>
    );
};

export default CategoryStep;
