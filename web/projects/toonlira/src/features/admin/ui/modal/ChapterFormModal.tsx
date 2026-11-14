import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Button } from '@ui/Button';
import Input from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { Select } from '@ui/Select';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { searchTitles, type TitleSearchResult } from '@entities/manga';
import { getGroups, type Group } from '@entities/group';
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
    const { isEditing, isLoadingDetail, isSubmitting, form, setForm, errors, valid, dirty, titleName, scanGroupName, submit } = useChapterFormModalState(chapterId, isOpen, presetTitleId);

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
                                <span className="flex-1 truncate rounded-ui-xs border border-ui-border bg-ui-surface-muted px-3 py-2.5 text-ui-body text-ui-fg">
                                    {presetTitleName ?? titleName ?? form.titleId}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, titleId: '' }))}>
                                    {t('dashboard.chapters.form.changeTitle')}
                                </Button>
                            </div>
                        ) : (
                            <EntitySearchSelect<TitleSearchResult>
                                queryKey={QUERY_KEYS.TITLES_SEARCH}
                                fetcher={async term => (term.trim().length < 2 ? [] : (await searchTitles(term, 0, 8)).content)}
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
                    <Field label={t('dashboard.chapters.form.contentLanguage')}>
                        <Select
                            value={form.contentLanguage}
                            onChange={e => setForm(f => ({ ...f, contentLanguage: e.target.value }))}
                            options={[
                                { value: 'pt-BR', label: t('dashboard.chapters.form.languagePt') },
                                { value: 'en-US', label: t('dashboard.chapters.form.languageEn') },
                                { value: 'es-ES', label: t('dashboard.chapters.form.languageEs') },
                            ]}
                            aria-label={t('dashboard.chapters.form.contentLanguage')}
                        />
                    </Field>
                    <Field label={t('dashboard.chapters.form.scanGroup')} hint={t('dashboard.chapters.form.scanGroupHint')}>
                        {form.scanGroupId ? (
                            <div className="flex items-center gap-2.5">
                                <span className="flex-1 truncate rounded-ui-xs border border-ui-border bg-ui-surface-muted px-3 py-2.5 text-ui-body text-ui-fg">
                                    {scanGroupName ?? form.scanGroupId}
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, scanGroupId: '' }))}>
                                    {t('dashboard.chapters.form.noScanGroup')}
                                </Button>
                            </div>
                        ) : (
                            <EntitySearchSelect<Group>
                                queryKey={`${QUERY_KEYS.GROUPS}:chapter-form`}
                                fetcher={async term => (await getGroups(0, 8, term)).content}
                                getKey={group => group.id}
                                getLabel={group => group.name}
                                onPick={group => setForm(f => ({ ...f, scanGroupId: group.id }))}
                                placeholder={t('dashboard.chapters.form.scanGroupHint')}
                                emptyLabel={t('dashboard.chapters.form.noScanGroup')}
                            />
                        )}
                    </Field>
                </FormRow>

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
