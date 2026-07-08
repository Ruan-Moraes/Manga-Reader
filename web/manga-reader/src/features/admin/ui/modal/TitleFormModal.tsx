import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { ModalSection } from '@ui/ModalSection';
import { FormRow } from '@ui/FormRow';
import { Button } from '@ui/Button';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Switch } from '@ui/Switch';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { TagSelectInput } from '@entities/catalog-filter';

import useTitleFormModalState from '../../model/useTitleFormModalState';
import Field from '../parts/Field';
import AuthorRolesInput from '../parts/AuthorRolesInput';
import PublishersInput from '../parts/PublishersInput';

type TitleFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    titleId: string | null;
    onSaved: () => void;
    onDelete: () => void;
};

const TitleFormModal = ({ isOpen, onClose, titleId, onSaved, onDelete }: TitleFormModalProps) => {
    const { t } = useTranslation('admin');

    const {
        isEditing,
        isSubmitting,
        form,
        setForm,
        setSelectedTags,
        name,
        setName,
        synopsis,
        setSynopsis,
        authors,
        setAuthors,
        publishers,
        setPublishers,
        allTags,
        statusOptions,
        valid,
        dirty,
        submit,
    } = useTitleFormModalState(titleId, isOpen);

    const handleSave = async () => {
        const ok = await submit();
        if (ok) onSaved();
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={isEditing ? t('dashboard.titles.editTitle') : t('dashboard.titles.newTitle')}
            description={t('dashboard.titles.form.modalSubtitle')}
            size="xl"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={isEditing ? t('common.save') : t('common.create')}
                    onSubmit={handleSave}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                    leftAction={
                        isEditing && (
                            <Button variant="ghost" size="sm" danger icon={Trash2} onClick={onDelete}>
                                {t('common.delete')}
                            </Button>
                        )
                    }
                />
            }
        >
            <div className="flex flex-col">
                <ModalSection title={t('dashboard.titles.form.sectionIdentity')}>
                    <LocalizedTextInput label={t('dashboard.titles.form.name')} value={name} onChange={setName} maxLength={200} />

                    <LocalizedTextInput label={t('dashboard.titles.form.synopsis')} value={synopsis} onChange={setSynopsis} multiline rows={3} requiredLanguages={[]} />
                </ModalSection>

                <ModalSection title={t('dashboard.titles.form.sectionClassification')}>
                    <FormRow columns={2}>
                        <Field label={t('dashboard.titles.form.type')}>
                            <Select
                                value={form.type}
                                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                options={[
                                    { value: 'manga', label: t('dashboard.titles.form.typeManga') },
                                    { value: 'manhwa', label: t('dashboard.titles.form.typeManhwa') },
                                    { value: 'manhua', label: t('dashboard.titles.form.typeManhua') },
                                ]}
                            />
                        </Field>
                        <Field label={t('dashboard.titles.form.status')}>
                            <Select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} options={statusOptions} />
                        </Field>
                    </FormRow>

                    <FormRow columns={2}>
                        <Field label={t('dashboard.titles.form.cover')}>
                            <Input type="text" placeholder="https://..." value={form.cover ?? ''} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))} />
                        </Field>
                        <Field label={t('dashboard.titles.form.genres')}>
                            <TagSelectInput options={allTags} onChange={setSelectedTags} placeholder={t('dashboard.titles.form.genresPlaceholder')} />
                        </Field>
                    </FormRow>

                    <Switch label={t('dashboard.titles.form.adult')} checked={form.adult} onChange={checked => setForm(f => ({ ...f, adult: checked }))} />
                </ModalSection>

                <ModalSection title={t('dashboard.titles.form.sectionCredits')}>
                    <FormRow columns={2}>
                        <Field label={t('dashboard.titles.form.authors')} hint={t('dashboard.titles.form.authorsHint')}>
                            <AuthorRolesInput value={authors} onChange={setAuthors} />
                        </Field>
                        <Field label={t('dashboard.titles.form.publishers')}>
                            <PublishersInput value={publishers} onChange={setPublishers} />
                        </Field>
                    </FormRow>
                </ModalSection>
            </div>
        </Modal>
    );
};

export default TitleFormModal;
