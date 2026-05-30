import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { EmptyState } from '@ui/EmptyState';
import { Stars } from '@ui/Stars';
import { Textarea } from '@ui/Textarea';

interface EndCardProps {
    chNum: string;
    rating: number;
    onRate: (v: number) => void;
    comment: string;
    onComment: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const EndCard = ({ chNum, rating, onRate, comment, onComment, onNext, onBack }: EndCardProps) => {
    const { t } = useTranslation('manga');

    return (
        <div className="flex flex-col items-center gap-6 rounded-mr-lg border border-mr-border bg-mr-secondary p-6 text-center">
            <EmptyState illustration="feliz" title={t('chapterEnd.title', { chNum })} description={t('chapterEnd.description')} />

            <div className="flex flex-col items-center gap-2">
                <p className="text-mr-tiny text-mr-fg-subtle">{t('chapterEnd.rateLabel')}</p>
                <Stars value={rating} size={24} interactive onChange={onRate} label={t('chapterEnd.ratingAria', { rating })} />
            </div>

            <div className="w-full">
                <Textarea
                    placeholder={t('chapterEnd.commentPlaceholder')}
                    rows={2}
                    value={comment}
                    onChange={e => onComment(e.target.value)}
                    className="text-left"
                />
                {comment.trim() && (
                    <div className="mt-2 flex justify-end">
                        <Button variant="primary" onClick={() => onComment('')}>
                            {t('chapterEnd.publish')}
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button variant="raised" onClick={onBack} className="flex-1">
                    {t('chapterEnd.backToWork')}
                </Button>
                <Button variant="primary" onClick={onNext} className="flex-1">
                    {t('chapterEnd.nextChapter')}
                </Button>
            </div>
        </div>
    );
};
