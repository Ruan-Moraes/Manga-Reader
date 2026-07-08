import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import { FormRow } from '@ui/FormRow';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';

import { slugify } from '../../model/slugify';
import Field from '../parts/Field';

import type { AdminAuthor, CreateAuthorRequest } from '../../model/admin.types';

type AuthorFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuthorRequest) => void;
    author?: AdminAuthor | null;
    isSubmitting: boolean;
};

const AuthorFormModal = ({ isOpen, onClose, onSubmit, author, isSubmitting }: AuthorFormModalProps) => {
    const { t } = useTranslation('admin');

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugTouched, setSlugTouched] = useState(false);
    const [bio, setBio] = useState('');
    const [nationality, setNationality] = useState('');

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { name, slug, bio, nationality });

    useEffect(() => {
        if (!isOpen) return;
        setName(author?.name ?? '');
        setSlug(author?.slug ?? '');
        setSlugTouched(Boolean(author));
        setBio(author?.bio ?? '');
        setNationality(author?.nationality ?? '');
        resetDirty();
    }, [author, isOpen, resetDirty]);

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugTouched) setSlug(slugify(value));
    };

    const valid = name.trim().length > 0;

    const save = () => {
        if (!valid) return;
        onSubmit({
            name: name.trim(),
            slug: slug.trim() || undefined,
            bio: bio.trim() || undefined,
            nationality: nationality.trim() || undefined,
        });
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={author ? t('authorForm.editTitle') : t('authorForm.newTitle')}
            size="md"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel')}
                    onCancel={onClose}
                    submitLabel={author ? t('common.save') : t('common.create')}
                    onSubmit={save}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <FormRow columns={2}>
                    <Field label={t('authorForm.name')}>
                        <Input type="text" value={name} onChange={e => handleNameChange(e.target.value)} placeholder={t('authorForm.namePlaceholder')} autoFocus />
                    </Field>
                    <Field label={t('authorForm.slug')} hint={t('authorForm.slugHint')}>
                        <Input
                            type="text"
                            value={slug}
                            onChange={e => {
                                setSlug(e.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="slug-do-autor"
                        />
                    </Field>
                </FormRow>
                <Field label={t('authorForm.bio')}>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder={t('authorForm.bioPlaceholder')} />
                </Field>
                <Field label={t('authorForm.nationality')} hint={t('authorForm.nationalityHint')}>
                    <Input type="text" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="JP" maxLength={2} />
                </Field>
            </div>
        </Modal>
    );
};

export default AuthorFormModal;
