import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Button } from '@ui/Button';
import Input from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { searchTitles, type Title } from '@entities/manga';
import type { ChapterValidationError } from '@entities/chapter';

import useChapterFormModalState from '../../model/useChapterFormModalState';
import EntitySearchSelect from '../parts/EntitySearchSelect';
import { FormRow } from '@ui/FormRow';
import Field from '../parts/Field';

type ChapterFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    chapterId: string | null;
    /** Pré-seleciona a obra (fluxo "novo capítulo" a partir da visão filtrada). */
    presetTitleId?: string;
    presetTitleName?: string;
    onSaved: () => void;
};

/** Traduz codes de validação do domínio — as regras nunca vivem na UI. */
const errorText = (t: (key: string, opts?: Record<string, unknown>) => string, error: ChapterValidationError | undefined): string | undefined =>
    error ? t(`dashboard.chapters.errors.${error.code}`, { ...error }) : undefined;

const ChapterFormModal = ({ isOpen, onClose, chapterId, presetTitleId, presetTitleName, onSaved }: ChapterFormModalProps) => {
    const { t } = useTranslation('admin');
    const { isEditing, isLoadingDetail, isSubmitting, form, setForm, errors, valid, dirty, titleName, submit } = useChapterFormModalState(chapterId, isOpen, presetTitleId);

    const errorFor = (codes: ChapterValidationError['code'][]) => errors.find(e => codes.includes(e.code));

    const handleSubmit = async () => {
        if (await submit()) onSaved();
    };

    const statusOptions = (['draft', 'scheduled', 'published'] as const).map(status => ({
        value: status,
        label: t(`dashboard.status.chapter.${status}`),
    }));

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={isEditing ? t('dashboard.chapters.form.editTitle') : t('dashboard.chapters.form.newTitle')}
            size="lg"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={t('common.save')}
                    onSubmit={handleSubmit}
                    submitDisabled={!valid || isLoadingDetail}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
                {!isEditing && (
                    <Field label={t('dashboard.chapters.form.title')} hint={form.titleId ? undefined : t('dashboard.chapters.form.titleHint')}>
                        {form.titleId ? (
                            <div className="flex items-center gap-2.5">
                                <span className="flex-1 truncate rounded-mr-xs border border-mr-border bg-mr-surface-muted px-3 py-2.5 text-mr-body text-mr-fg">
                                    {presetTitleName ?? titleName ?? form.titleId}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, titleId: '' }))}>
                                    {t('dashboard.chapters.form.changeTitle')}
                                </Button>
                            </div>
                        ) : (
                            <EntitySearchSelect<Title>
                                queryKey={QUERY_KEYS.TITLES_SEARCH}
                                fetcher={async term => (await searchTitles(term, 0, 8)).content}
                                getKey={title => title.id}
                                getLabel={title => title.name}
                                onPick={title => setForm(f => ({ ...f, titleId: title.id }))}
                                placeholder={t('dashboard.chapters.form.searchTitlePlaceholder')}
                                emptyLabel={t('dashboard.chapters.form.searchTitleEmpty')}
                            />
                        )}
                    </Field>
                )}

                <div className="grid gap-4 sm:grid-cols-[1fr_120px_120px]">
                    <Field label={t('dashboard.chapters.form.chapterTitle')}>
                        <Input
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder={t('dashboard.chapters.form.chapterTitlePlaceholder')}
                            error={errorText(t, errorFor(['title_required', 'title_too_long']))}
                            maxLength={160}
                        />
                    </Field>
                    <Field label={t('dashboard.chapters.form.number')}>
                        <Input
                            value={form.number}
                            onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                            placeholder="12.5"
                            error={errorText(t, errorFor(['number_invalid', 'number_taken']))}
                        />
                    </Field>
                    <Field label={t('dashboard.chapters.form.displayOrder')} hint={t('dashboard.chapters.form.displayOrderHint')}>
                        <Input type="number" min={1} value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} placeholder="—" />
                    </Field>
                </div>

                <Field label={t('dashboard.chapters.form.description')} hint={t('dashboard.chapters.form.descriptionHint')}>
                    <Textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder={t('dashboard.chapters.form.descriptionPlaceholder')}
                        rows={3}
                        maxLength={500}
                    />
                </Field>

                <FormRow columns={2}>
                    <Field label={t('dashboard.chapters.form.status')} hint={form.status === 'published' ? t('dashboard.chapters.form.publishHint') : undefined}>
                        <Select
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof f.status }))}
                            options={statusOptions}
                            aria-label={t('dashboard.chapters.form.status')}
                        />
                    </Field>
                    {form.status === 'scheduled' && (
                        <Field label={t('dashboard.chapters.form.scheduledAt')}>
                            <Input
                                type="datetime-local"
                                value={form.scheduledAt}
                                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                error={errorText(t, errorFor(['schedule_requires_future_date']))}
                            />
                        </Field>
                    )}
                </FormRow>
            </div>
        </Modal>
    );
};

export default ChapterFormModal;
