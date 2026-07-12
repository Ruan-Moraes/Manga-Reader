import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@shared/lib/cn';
import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';
import { Modal } from '@ui/Modal';
import { StarsInput } from '@ui/Stars';

import { REVIEW_CRITERIA, type ReviewCriterionKey } from '@entities/review';

type RatingSubmitData = {
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
    reviewTitle?: string;
    spoiler?: boolean;
};

type RatingModalProps = {
    isModalOpen: boolean;
    closeModal: () => void;
    onSubmitRating: (data: RatingSubmitData) => void | Promise<void>;
    isSubmitting?: boolean;
    /** Título da obra, exibido no cabeçalho do formulário */
    titleName?: string;
    /** Valores iniciais — quando presentes, o modal entra em modo edição. */
    initial?: Partial<RatingSubmitData>;
};

type Scores = Partial<Record<ReviewCriterionKey, number>>;

/** Média (1 casa decimal) das notas não-nulas; 0 quando nenhuma nota foi dada. */
const averageScore = (values: number[]): number => {
    const rated = values.filter(Boolean);
    return rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : 0;
};

function ReviewFormBody({
    titleName,
    onCancel,
    onSubmit,
    isSubmitting,
    initial,
}: {
    titleName?: string;
    onCancel: () => void;
    onSubmit: (data: RatingSubmitData) => void | Promise<void>;
    isSubmitting?: boolean;
    initial?: Partial<RatingSubmitData>;
}) {
    const { t } = useTranslation('rating');
    const isEdit = initial != null;
    const [scores, setScores] = useState<Scores>(() =>
        initial
            ? REVIEW_CRITERIA.reduce<Scores>((acc, c) => {
                  const value = initial[c.key];
                  if (value) acc[c.key] = value;
                  return acc;
              }, {})
            : {},
    );
    const [reviewTitle, setReviewTitle] = useState(initial?.reviewTitle ?? '');
    const [comment, setComment] = useState(initial?.comment ?? '');
    const [spoiler, setSpoiler] = useState(initial?.spoiler ?? false);

    const rated = REVIEW_CRITERIA.filter(c => (scores[c.key] ?? 0) > 0).length;
    const pct = Math.round((rated / REVIEW_CRITERIA.length) * 100);
    const overall = averageScore(REVIEW_CRITERIA.map(c => scores[c.key] ?? 0));
    const canSubmit = rated >= 1;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            await onSubmit({
                funRating: scores.funRating ?? 0,
                artRating: scores.artRating ?? 0,
                storylineRating: scores.storylineRating ?? 0,
                charactersRating: scores.charactersRating ?? 0,
                originalityRating: scores.originalityRating ?? 0,
                pacingRating: scores.pacingRating ?? 0,
                comment: comment.trim() || undefined,
                reviewTitle: reviewTitle.trim() || undefined,
                spoiler,
            });
        } catch {
            // Erros de API/auth são tratados pelos interceptors e toasts globais.
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Cabeçalho: obra + nota geral ao vivo */}
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-mr-bold uppercase tracking-mr-label text-mr-accent">{t('modal.evaluateLabel')}</p>
                    {titleName && <p className="truncate text-[15px] font-mr-extrabold text-mr-fg">{titleName}</p>}
                </div>
                <div className="shrink-0 text-right">
                    <p className={cn('text-[28px] font-mr-extrabold leading-none tabular-nums', overall ? 'text-mr-accent' : 'text-mr-fg-subtle')}>
                        {overall ? overall.toFixed(1) : '—'}
                    </p>
                    <p className="text-[11px] text-mr-fg-subtle">{t('modal.overallLabel')}</p>
                </div>
            </div>

            {/* Barra de progresso */}
            <div>
                <div className="mb-1 flex items-center justify-between text-[12px] text-mr-fg-subtle">
                    <span>{t('modal.progress', { rated, total: REVIEW_CRITERIA.length })}</span>
                    <span>{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--mr-gray-700)' }}>
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: 'var(--mr-accent)' }} />
                </div>
            </div>

            {/* 6 critérios visíveis de uma vez */}
            <div className="flex flex-col gap-2">
                {REVIEW_CRITERIA.map(c => {
                    const val = scores[c.key] ?? 0;
                    const name = t(c.labelKey);
                    return (
                        <div
                            key={c.key}
                            className={cn(
                                'flex items-center justify-between gap-3 rounded-mr-xs border p-3 transition-colors duration-200',
                                val > 0 ? 'border-mr-accent bg-mr-accent-25' : 'border-[#333] bg-[#1c1c1d]',
                            )}
                        >
                            <div className="min-w-0">
                                <p className="text-[14px] font-mr-bold text-mr-fg">{name}</p>
                                <p className="text-[12px] text-mr-fg-subtle">{t(c.descKey)}</p>
                            </div>
                            <div className="shrink-0">
                                <StarsInput
                                    value={val}
                                    onChange={v => setScores(s => ({ ...s, [c.key]: v }))}
                                    size={24}
                                    label={t('modal.rateCriterion', { name })}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Título + comentário opcionais */}
            <div className="flex flex-col gap-2">
                <input
                    className="h-10 w-full rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 text-[14px] text-mr-fg outline-none transition-colors focus:border-mr-accent placeholder:text-mr-fg-subtle"
                    placeholder={t('modal.reviewTitlePlaceholder')}
                    value={reviewTitle}
                    maxLength={80}
                    onChange={e => setReviewTitle(e.target.value)}
                />
                <textarea
                    className="min-h-[80px] w-full resize-none rounded-mr-xs border border-mr-tertiary bg-mr-primary px-3 py-2 text-[14px] text-mr-fg outline-none transition-colors focus:border-mr-accent placeholder:text-mr-fg-subtle"
                    rows={3}
                    placeholder={t('modal.commentPlaceholder')}
                    value={comment}
                    maxLength={600}
                    onChange={e => setComment(e.target.value)}
                />
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setSpoiler(s => !s)}
                        aria-pressed={spoiler}
                        className={cn(
                            'flex items-center gap-1.5 rounded-mr-xs px-3 py-1 text-[12px] font-mr-bold transition-colors',
                            spoiler
                                ? 'border border-[var(--mr-danger)] bg-[rgba(255,120,79,.18)] text-[var(--mr-danger)]'
                                : 'border border-mr-tertiary bg-mr-secondary text-mr-fg-subtle hover:border-[var(--mr-danger)] hover:text-[var(--mr-danger)]',
                        )}
                    >
                        <span
                            className={cn('size-2 rounded-full transition-colors', spoiler ? 'bg-[var(--mr-danger)]' : 'bg-mr-tertiary')}
                            aria-hidden="true"
                        />
                        {t('modal.spoilerToggle')}
                    </button>
                    <span className="text-[12px] text-mr-fg-subtle">{comment.length}/600</span>
                </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    {t('modal.cancel')}
                </Button>
                <Button variant="primary" size="sm" disabled={!canSubmit || isSubmitting} loading={isSubmitting} onClick={handleSubmit}>
                    {isEdit ? t('modal.save') : canSubmit ? t('modal.publish') : t('modal.publishDisabled')}
                </Button>
            </div>
        </div>
    );
}

function ReviewSuccess({ overall, onDone }: { overall: number; onDone: () => void }) {
    const { t } = useTranslation('rating');

    return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
            <Illustration type="feliz" alt="" width={120} height={120} />
            <div>
                <h3 className="text-[20px] font-mr-extrabold text-mr-fg">{t('modal.successTitle')}</h3>
                <p className="mt-1 text-[14px] text-mr-fg-muted">{t('modal.successBody', { overall: overall.toFixed(1) })}</p>
            </div>
            <Button variant="primary" onClick={onDone}>
                {t('modal.successCta')}
            </Button>
        </div>
    );
}

const RatingModal = ({ isModalOpen, closeModal, onSubmitRating, isSubmitting = false, titleName, initial }: RatingModalProps) => {
    const { t } = useTranslation('rating');

    const [done, setDone] = useState<number | null>(null);

    const handleSubmit = async (data: RatingSubmitData) => {
        const overall = averageScore([data.funRating, data.artRating, data.storylineRating, data.charactersRating, data.originalityRating, data.pacingRating]);

        await onSubmitRating(data);
        setDone(overall);
    };

    const handleClose = () => {
        setDone(null);

        closeModal();
    };

    return (
        <Modal
            open={isModalOpen}
            onClose={handleClose}
            title={done == null ? (initial ? t('modal.editLabel') : t('modal.evaluateLabel')) : ''}
            size="lg"
            hideClose={done != null}
        >
            {done == null ? (
                <ReviewFormBody titleName={titleName} onCancel={handleClose} onSubmit={handleSubmit} isSubmitting={isSubmitting} initial={initial} />
            ) : (
                <ReviewSuccess overall={done} onDone={handleClose} />
            )}
        </Modal>
    );
};

export default RatingModal;
